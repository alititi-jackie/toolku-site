import { Link, RouteObject } from 'react-router-dom';
import { lazy } from 'react';

const Home = lazy(() => import('../pages/home'));
const ToolsByCategory = lazy(() => import('../pages/tools-by-category'));

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Home />
  },
  {
    path: '/categories/:categoryName',
    element: <ToolsByCategory />
  },
  {
    path: '*',
    element: <main style={{ padding: 40, textAlign: 'center' }}><h1>404</h1><p>Page not found</p><Link to="/">ToolKu · Home / 首页</Link></main>
  }
];

export default routes;
