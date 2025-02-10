import { AppLayout } from "@/pages/app-layout";
import { DashboardPage } from "@/pages/dashboard/dashboard-page";
import { BrowserRouter, Route, Routes } from "react-router";
import "./index.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
