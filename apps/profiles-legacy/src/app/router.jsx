import { createBrowserRouter } from 'react-router-dom';
import PublicProfilePage from '../pages/public-profile/PublicProfilePage.jsx';

/** Root path derives username from subdomain in page shell for now — keep stable for ISR prerender adapters. */

const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicProfilePage />,
  },
  {
    path: '/:username',
    element: <PublicProfilePage />,
  },
]);

export default router;
