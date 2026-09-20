import "./App.css";
import { createBrowserRouter, RouterProvider } from "react-router";
import FabCodeManager from "./components/fabricCode";

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      Component: FabCodeManager,
    },
  ]);

  return <RouterProvider router={router} />;
}

export default App;
