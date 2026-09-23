import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const PAGE_SIZE = 20;
const ESTIMATED_ITEM_HEIGHT = 220;
const OVERSCAN_PX = 600;

function findFirstBottomGreaterThan(positions, offset) {
  let low = 0;
  let high = positions.length;

  while (low < high) {
    const middle = Math.floor((low + high) / 2);

    if (positions[middle].bottom > offset) {
      high = middle;
    } else {
      low = middle + 1;
    }
  }

  return low;
}

function findFirstTopAtLeast(positions, offset) {
  let low = 0;
  let high = positions.length;

  while (low < high) {
    const middle = Math.floor((low + high) / 2);

    if (positions[middle].top >= offset) {
      high = middle;
    } else {
      low = middle + 1;
    }
  }

  return low;
}

const Feed = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [layoutVersion, setLayoutVersion] = useState(0);

  const listRef = useRef(null);
  const scrollTopRef = useRef(0);
  const resizeObserverRef = useRef(null);

  const measurementsRef = useRef(new Map());
  const elementsRef = useRef(new Map());
  const positionsRef = useRef([]);
  const pendingAnchorRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    fetch(
      `https://dummyjson.com/products?limit=${PAGE_SIZE}&skip=${skip}`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch");
        }

        return response.json();
      })
      .then((data) => {
        if (cancelled) {
          return;
        }

        setProducts((previousProducts) => [
          ...previousProducts,
          ...data.products,
        ]);

        setLoading(false);
        setIsFetching(false);

        if (data.products.length < PAGE_SIZE) {
          setHasMore(false);
        }
      })
      .catch((fetchError) => {
        if (cancelled) {
          return;
        }

        setError(fetchError.message);
        setLoading(false);
        setIsFetching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [skip]);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      const positionsBeforeChange = positionsRef.current;
      const currentScrollTop = scrollTopRef.current;

      const anchorIndex = findFirstBottomGreaterThan(
        positionsBeforeChange,
        currentScrollTop
      );

      const anchorProduct = products[anchorIndex];
      const anchorPosition = positionsBeforeChange[anchorIndex];

      if (anchorProduct && anchorPosition) {
        pendingAnchorRef.current = {
          id: anchorProduct.id,
          offset: currentScrollTop - anchorPosition.top,
        };
      }

      let measurementsChanged = false;

      entries.forEach((entry) => {
        const productId = entry.target.dataset.productId;

        if (!productId) {
          return;
        }

        const borderBoxSize = entry.borderBoxSize?.[0];

        const nextHeight =
          borderBoxSize?.blockSize ?? entry.contentRect.height;

        const previousHeight =
          measurementsRef.current.get(productId) ??
          ESTIMATED_ITEM_HEIGHT;

        if (Math.abs(previousHeight - nextHeight) < 0.5) {
          return;
        }

        measurementsRef.current.set(productId, nextHeight);
        measurementsChanged = true;
      });

      if (measurementsChanged) {
        setLayoutVersion((version) => version + 1);
      }
    });

    resizeObserverRef.current = observer;

    return () => {
      observer.disconnect();
      resizeObserverRef.current = null;
    };
  }, [products]);

  const positions = useMemo(() => {
    let currentTop = 0;

    const nextPositions = products.map((product) => {
      const height =
        measurementsRef.current.get(String(product.id)) ??
        measurementsRef.current.get(product.id) ??
        ESTIMATED_ITEM_HEIGHT;

      const position = {
        id: product.id,
        top: currentTop,
        bottom: currentTop + height,
        height,
      };

      currentTop += height;

      return position;
    });

    positionsRef.current = nextPositions;

    return nextPositions;
  }, [products, layoutVersion]);

  const totalHeight =
    positions.length === 0
      ? 0
      : positions[positions.length - 1].bottom;

  const visibleStartOffset = Math.max(
    0,
    scrollTop - OVERSCAN_PX
  );

  const visibleEndOffset =
    scrollTop + viewportHeight + OVERSCAN_PX;

  const startIndex = Math.min(
    findFirstBottomGreaterThan(
      positions,
      visibleStartOffset
    ),
    products.length
  );

  const endIndex = Math.min(
    findFirstTopAtLeast(
      positions,
      visibleEndOffset
    ) + 1,
    products.length
  );

  const visibleProducts = products.slice(
    startIndex,
    endIndex
  );

  useLayoutEffect(() => {
    const listElement = listRef.current;
    const pendingAnchor = pendingAnchorRef.current;

    if (!listElement || !pendingAnchor) {
      return;
    }

    const anchorIndex = products.findIndex(
      (product) => product.id === pendingAnchor.id
    );

    if (anchorIndex === -1 || !positions[anchorIndex]) {
      pendingAnchorRef.current = null;
      return;
    }

    const correctedScrollTop =
      positions[anchorIndex].top + pendingAnchor.offset;

    listElement.scrollTop = correctedScrollTop;
    scrollTopRef.current = correctedScrollTop;
    setScrollTop(correctedScrollTop);

    pendingAnchorRef.current = null;
  }, [products, positions]);

  useLayoutEffect(() => {
    const listElement = listRef.current;

    if (!listElement) {
      return;
    }

    const updateViewportHeight = () => {
      setViewportHeight(listElement.clientHeight);
    };

    updateViewportHeight();

    const observer = new ResizeObserver(updateViewportHeight);
    observer.observe(listElement);

    return () => {
      observer.disconnect();
    };
  }, []);

  useLayoutEffect(() => {
    const observer = resizeObserverRef.current;

    if (!observer) {
      return;
    }

    elementsRef.current.forEach((element) => {
      observer.observe(element);
    });
  }, [visibleProducts]);

  function registerItemElement(productId, element) {
    const observer = resizeObserverRef.current;

    if (!element) {
      const previousElement =
        elementsRef.current.get(productId);

      if (previousElement && observer) {
        observer.unobserve(previousElement);
      }

      elementsRef.current.delete(productId);
      return;
    }

    element.dataset.productId = String(productId);
    elementsRef.current.set(productId, element);

    if (observer) {
      observer.observe(element);
    }
  }

  function handleScroll(event) {
    const nextScrollTop = event.currentTarget.scrollTop;
    const clientHeight = event.currentTarget.clientHeight;

    scrollTopRef.current = nextScrollTop;
    setScrollTop(nextScrollTop);

    const nearLoadedEnd =
      nextScrollTop + clientHeight >=
      totalHeight - OVERSCAN_PX;

    if (nearLoadedEnd && hasMore && !isFetching) {
      setIsFetching(true);
      setSkip((previousSkip) => previousSkip + PAGE_SIZE);
    }
  }

  return (
    <div>
      <div
        ref={listRef}
        className="listContainer"
        onScroll={handleScroll}
        style={{
          height: "700px",
          overflowY: "auto",
          position: "relative",
        }}
      >
        {error && (
          <h2
            style={{
              position: "absolute",
              zIndex: 2,
              background: "white",
            }}
          >
            {error}
          </h2>
        )}

        {loading && products.length === 0 && (
          <h2
            style={{
              position: "absolute",
              zIndex: 2,
              background: "white",
            }}
          >
            Loading...
          </h2>
        )}

        <div
          className="virtualContent"
          style={{
            position: "relative",
            width: "100%",
            height: `${totalHeight}px`,
          }}
        >
          {visibleProducts.map((product, localIndex) => {
            const productIndex = startIndex + localIndex;
            const position = positions[productIndex];

            return (
              <div
                key={product.id}
                ref={(element) =>
                  registerItemElement(product.id, element)
                }
                className="feedItem"
                style={{
                  position: "absolute",
                  top: `${position.top}px`,
                  left: 0,
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
                <img
                  src={product.thumbnail}
                  alt={product.title}
                  style={{
                    display: "block",
                    maxWidth: "100%",
                  }}
                />

                <h2>{product.title}</h2>
                <p>Price: {product.price}</p>
                <p>Stock: {product.stock}</p>
              </div>
            );
          })}
        </div>

        {isFetching && !loading && (
          <p
            style={{
              position: "sticky",
              bottom: 0,
              background: "white",
              margin: 0,
              padding: "8px",
            }}
          >
            Loading more...
          </p>
        )}
      </div>
    </div>
  );
};

export default Feed;