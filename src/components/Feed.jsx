// import React, { useEffect, useState } from "react";

// const Feed = () => {
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [skip, setSkip] = useState(0);

//   const [hasMore, setHasMore] = useState(true);
//   const [isFetching, setIsFetching] = useState(false);

//   useEffect(() => {
//     fetch(`https://dummyjson.com/products?limit=20&skip=${skip}`)
//       .then((res) => {
//         if (!res.ok) {
//           throw new Error("Failed to fetch");
//         }
//         console.log("what is happening here in return json");
//         return res.json();

//       })
//       .then((data) => {
//         // console.log("skip =", skip);
//         console.log("skip =", skip);
//         console.log("received =", data.products.length);
//         console.log(data.products.map((p) => p.id));
//         console.log("what is happening here in data received");

//         setProducts((previousProduct) => {
//           return [...previousProduct, ...data.products];
//         });
//         setLoading(false);
//         if (data.products.length < 20) {
//           setHasMore(false);
//         }
//         console.log("what is happening here in setloading");
//         setIsFetching(false);

//       })
//       .catch((err) => {
//         setError(err.message);
//         setLoading(false);
//         setIsFetching(false);
//       });
//   }, [skip]);

//   function handleScroll(e) {
//     const scrolltop = e.target.scrollTop;
//     const clientHeight = e.target.clientHeight;
//     const scrollHeight = e.target.scrollHeight;
//     console.log(scrolltop, clientHeight, scrollHeight);

//     if (scrolltop + clientHeight >= scrollHeight - 300) {
//       if (hasMore && !isFetching) {
//         setIsFetching(true);
//         setSkip((previousSkip) => previousSkip + 20);
//         console.log("fetching..");
//       }
//     }
//   }

//   return (
//     <div>
//       <div className="listContainer" onScroll={handleScroll}>
//         {loading && <h2>Loading...</h2>}

//         {error && <h2>{error}</h2>}
//         {products.map((product) => (
//           <div key={product.id}>
//             <img src={product.thumbnail} alt={product.title} />
//             <h2>{product.title}</h2>
//             <p>{product.price}</p>
//             <p>{product.stock}</p>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default Feed;
import React, { useEffect, useRef, useState } from "react";

const ITEM_HEIGHT = 260;
const OVERSCAN = 4;
const PAGE_SIZE = 20;

const Feed = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [skip, setSkip] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  const [hasMore, setHasMore] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  const listRef = useRef(null);

  useEffect(() => {
    fetch(`https://dummyjson.com/products?limit=${PAGE_SIZE}&skip=${skip}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch");
        }

        return res.json();
      })
      .then((data) => {
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
      .catch((err) => {
        setError(err.message);
        setLoading(false);
        setIsFetching(false);
      });
  }, [skip]);

  const viewportHeight = listRef.current?.clientHeight ?? 0;

  const firstVisibleIndex = Math.floor(scrollTop / ITEM_HEIGHT);

  const lastVisibleIndex = Math.ceil(
    (scrollTop + viewportHeight) / ITEM_HEIGHT,
  );

  const startIndex = Math.max(0, firstVisibleIndex - OVERSCAN);

  const endIndex = Math.min(products.length, lastVisibleIndex + OVERSCAN);

  const visibleProducts = products.slice(startIndex, endIndex);

  const totalHeight = products.length * ITEM_HEIGHT;
  const topSpacerHeight = startIndex * ITEM_HEIGHT;
  const bottomSpacerHeight = (products.length - endIndex) * ITEM_HEIGHT;

  function handleScroll(e) {
    const currentScrollTop = e.currentTarget.scrollTop;
    const clientHeight = e.currentTarget.clientHeight;

    setScrollTop(currentScrollTop);

    if (
      currentScrollTop + clientHeight >= totalHeight - 300 &&
      hasMore &&
      !isFetching
    ) {
      setIsFetching(true);
      setSkip((previousSkip) => previousSkip + PAGE_SIZE);
    }
  }

  return (
    <div>
      <div ref={listRef} className="listContainer" onScroll={handleScroll}>
        <div className="virtualContent" style={{ height: totalHeight }}>
          <div style={{ height: topSpacerHeight }} />

          {visibleProducts.map((product) => (
            <div className="feedItem" key={product.id}>
              <img src={product.thumbnail} alt={product.title} />
              <h2>{product.title}</h2>
              <p>{product.price}</p>
              <p>{product.stock}</p>
            </div>
          ))}

          <div style={{ height: bottomSpacerHeight }} />
        </div>

        {loading && <h2>Loading...</h2>}
        {error && <h2>{error}</h2>}
        {isFetching && !loading && <p>Loading more...</p>}
      </div>
    </div>
  );
};

export default Feed;
