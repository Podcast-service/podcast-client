import { Route, Routes } from "react-router-dom";
import { HelloWorld } from "./components/HelloWorld";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HelloWorld />} />
    </Routes>
  );
}

export default App;
