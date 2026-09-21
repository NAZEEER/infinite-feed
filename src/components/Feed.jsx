import React, { useEffect, useState } from "react";

const Feed = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [skip, setSkip] = useState(0);

  const [hasMore, setHasMore] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    fetch(`https://dummyjson.com/products?limit=20&skip=${skip}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch");
        }
        console.log("what is happening here in return json");
        return res.json();
        
      })
      .then((data) => {
        // console.log("skip =", skip);
        console.log("skip =", skip);
        console.log("received =", data.products.length);
        console.log(data.products.map((p) => p.id));
        console.log("what is happening here in data received");

        setProducts((previousProduct) => {
          return [...previousProduct, ...data.products];
        });
        setLoading(false);
        if (data.products.length < 20) {
          setHasMore(false);
        }
        console.log("what is happening here in setloading");
        setIsFetching(false);

      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
        setIsFetching(false);
      });
  }, [skip]);

  function handleScroll(e) {
    const scrolltop = e.target.scrollTop;
    const clientHeight = e.target.clientHeight;
    const scrollHeight = e.target.scrollHeight;
    console.log(scrolltop, clientHeight, scrollHeight);

    if (scrolltop + clientHeight >= scrollHeight - 300) {
      if (hasMore && !isFetching) {
        setIsFetching(true);
        setSkip((previousSkip) => previousSkip + 20);
        console.log("fetching..");
      }
    }
  }

  return (
    <div>
      <div className="listContainer" onScroll={handleScroll}>
        {loading && <h2>Loading...</h2>}

        {error && <h2>{error}</h2>}
        {products.map((product) => (
          <div key={product.id}>
            <img src={product.thumbnail} alt={product.title} />
            <h2>{product.title}</h2>
            <p>{product.price}</p>
            <p>{product.stock}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Feed;
