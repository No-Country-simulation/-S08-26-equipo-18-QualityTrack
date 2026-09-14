import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import DashboardPage from "../pages/DashboardPage";
import NotFoundPage from "../pages/NotFoundPage";
import ClientsPage from "../pages/ClientsPage";
import RequestsPage from "../pages/RequestsPage";
import QuotationsPage from "../pages/QuotationsPage";
import WorkOrderDetailPage from "../pages/WorkOrderDetailPage";
import WorkOrdersPage from "../pages/WorkOrdersPage";   
import QualityPage from "../pages/QualityPage";
import DeliveriesPage from "../pages/DeliveriesPage";

const router = createBrowserRouter([
    {
        path: '/',
        element: <Navigate to="/dashboard" replace />,
    },
    {
        path: '/login',
        element: <LoginPage />,
    },
    {
        path: '/dashboard',
        element: <DashboardPage />,
    },
    {
        path: '/clients',
        element: <ClientsPage />,
    },
    {
        path: '/requests',
        element: <RequestsPage />,
    },
    {
        path: '/quotations',
        element: <QuotationsPage />,
    },
    {
        path: '/work-orders',
        element: <WorkOrdersPage />,
    },
    {
        path: '/work-orders/:id',
        element: <WorkOrderDetailPage />,
    },
    {
        path: '/quality',
        element: <QualityPage />,
    },
    {
        path: '/deliveries',
        element: <DeliveriesPage />,
    },
    {
        path: '*',
        element: <NotFoundPage />,
    },
]);

export default function AppRoutes() {
    return <RouterProvider router={router} />;
}