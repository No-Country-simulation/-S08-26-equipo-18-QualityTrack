import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import DashboardPage from "../pages/DashboardPage";
import NotFoundPage from "../pages/NotFoundPage";
import ClientsPage from "../pages/ClientsPage";
import UsersPage from "../pages/UsersPage";
import RequestsPage from "../pages/RequestsPage";
import QuotationsPage from "../pages/QuotationsPage";
import WorkOrderDetailPage from "../pages/WorkOrderDetailPage";
import WorkOrdersPage from "../pages/WorkOrdersPage";
import QualityPage from "../pages/QualityPage";
import DeliveriesPage from "../pages/DeliveriesPage";
import DashboardLayout from "../layouts/DashboardLayout";
import ProtectedRoute from "./guards/ProtectedRoute";
import PublicRoute from "./guards/PublicRoute";

const router = createBrowserRouter([
    {
        path: '/',
        element: <Navigate to="/dashboard" replace />,
    },
    {
        element: <PublicRoute />,
        children: [
            {
                path: '/login',
                element: <LoginPage />,
            },
        ],
    },
    {
        element: <ProtectedRoute />,
        children: [
            {
                element: <DashboardLayout />,
                children: [
                    { path: '/dashboard', element: <DashboardPage /> },
                    {
                        path: '/users',
                        element: <ProtectedRoute requiredPermission="users:view"><UsersPage /></ProtectedRoute>,
                    },
                    {
                        path: '/clients',
                        element: (
                            <ProtectedRoute requiredPermission="clients:view">
                                <ClientsPage />
                            </ProtectedRoute>
                        ),
                    },
                    {
                        path: '/requests',
                        element: (
                            <ProtectedRoute requiredPermission="requests:view">
                                <RequestsPage />
                            </ProtectedRoute>
                        ),
                    },
                    {
                        path: '/quotations',
                        element: (
                            <ProtectedRoute requiredPermission="quotations:view">
                                <QuotationsPage />
                            </ProtectedRoute>
                        ),
                    },
                    {
                        path: '/work-orders',
                        element: (
                            <ProtectedRoute requiredPermission="workOrders:view">
                                <WorkOrdersPage />
                            </ProtectedRoute>
                        ),
                    },
                    {
                        path: '/work-orders/:id',
                        element: (
                            <ProtectedRoute requiredPermission="workOrders:view">
                                <WorkOrderDetailPage />
                            </ProtectedRoute>
                        ),
                    },
                    {
                        path: '/quality',
                        element: (
                            <ProtectedRoute requiredPermission="quality:view">
                                <QualityPage />
                            </ProtectedRoute>
                        ),
                    },
                    {
                        path: '/deliveries',
                        element: (
                            <ProtectedRoute requiredPermission="deliveries:view">
                                <DeliveriesPage />
                            </ProtectedRoute>
                        ),
                    },
                ],
            },
        ],
    },
    {
        path: '*',
        element: <NotFoundPage />,
    },
]);

export default function AppRoutes() {
    return <RouterProvider router={router} />;
}
