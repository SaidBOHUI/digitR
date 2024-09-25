//Routeur
import * as React from "react";
import { Navigate, Route, Routes } from "react-router";
import HomePage from "../Pages/HomePage";

const MainRoutes = () => {

	return (
		<Routes>
			<Route path="/" element={<HomePage />} />
		</Routes>
	);
};

export default MainRoutes;
