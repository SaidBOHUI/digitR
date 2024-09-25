import { BrowserRouter, useLocation } from "react-router-dom";
import Header from './Components/Header';
import MainRoutes from "./Routes/MainRoutes";
// import Footer from "./Components/footer/Footer";
// import { ThemeProvider } from "@mui/material/styles";
// import themeGlobal from "./themes/themeGlobal";
// import Header from './Components/Header'
// import { BannerProvider } from "./contexts/BannerContext";
// import Header from "./Components/header/Header";

const App = () => {
	return (
		//<>
		<BrowserRouter>
			{/* <Header /> */}
			<MainRoutes />
		</BrowserRouter>
		//</>
	);
};

export default App;
