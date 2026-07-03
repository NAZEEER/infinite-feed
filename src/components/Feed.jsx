import React, { useEffect, useState } from "react";

const Feed = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [skip , setSkip] = useState(0)

  useEffect(() => {
    fetch(`https://dummyjson.com/products?limit=20&skip=$(skip)`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch");
        }
        return res.json();
      })
      .then((data) => {
        setProducts(data.products);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div>
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
  );
};

export default Feed;
