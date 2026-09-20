import "./App.css";
import { createBrowserRouter, RouterProvider } from "react-router";
import FabCodeManager from "./components/fabricCode";
import NotFound from "./components/notFound";

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      Component: FabCodeManager,
    },
    {
      path: "*",
      Component: NotFound,
    },
  ]);

  return <RouterProvider router={router} />;
}

export default App;
