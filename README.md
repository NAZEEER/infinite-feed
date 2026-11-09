# Infinite Feed

A React and Vite product feed that combines paginated API loading with custom variable-height list virtualization.

> Portfolio draft: this README is prepared for review. It has not been published to GitHub.

## Features

- Loads products from the DummyJSON REST API in pages of 20 products.
- Requests additional pages as the user approaches the loaded end of the scroll container.
- Renders only the visible product range plus an overscan buffer.
- Supports variable-height items by measuring rendered cards with `ResizeObserver`.
- Uses binary search to find the first and last item intersecting the visible range.
- Corrects the scroll position after item measurements change so the current content stays anchored.
- Displays initial loading, incremental loading, and fetch-error states.

## Tech Stack

- React
- JavaScript and JSX
- Vite
- CSS
- Fetch API
- DummyJSON product API

## Architecture and Implementation

The main feed component keeps product data, pagination state, scroll state, measurements, and virtual positions in separate React state and refs. Each product is assigned an estimated height until it is rendered and measured. The component then rebuilds cumulative `top` and `bottom` positions and uses two binary-search helpers to calculate the visible slice.

Visible cards are positioned inside a spacer whose height equals the cumulative content height. A `ResizeObserver` updates card measurements and the list viewport height. When a measurement changes above the current viewport, the component records an anchor product and restores its relative offset after recalculating positions.

## Getting Started

### Requirements

- Node.js
- npm

### Install and run

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

### Other scripts

```bash
npm run build
npm run lint
npm run preview
```

## Project Structure

```text
src/
  App.jsx
  components/
    Feed.jsx
  main.jsx
```

## Screenshot and Demo

<!-- Screenshot placeholder: add a screenshot of the running feed and a close-up showing the scroll container after capturing it locally. -->

Live demo: `[Add deployed URL if one is available]`

## Notes

- The feed depends on network access to `https://dummyjson.com`.
- The repository currently uses the default Vite-style project setup, so the screenshots and live URL should be added after local verification or deployment.
