import { useEffect, useState } from 'react';

export type Page = 'home' | 'status' | 'create';

interface RouteState {
  page: Page;
  params: Record<string, string>;
}

let currentRoute: RouteState = { page: 'home', params: {} };
let routeListeners: Array<(route: RouteState) => void> = [];

export function subscribeToRoute(callback: (route: RouteState) => void) {
  routeListeners.push(callback);
  callback(currentRoute);

  return () => {
    routeListeners = routeListeners.filter((c) => c !== callback);
  };
}

function emitRouteChange() {
  routeListeners.forEach((cb) => cb(currentRoute));
}

export function useNavigate() {
  return (path: string, params?: Record<string, string>) => {
    const parts = path.split('/').filter(Boolean);
    const page = (parts[0] || 'home') as Page;

    currentRoute = {
      page,
      params: params || {},
    };

    emitRouteChange();

    // Update browser history
    const queryString = new URLSearchParams(params || {}).toString();
    const url = queryString ? `/${page}?${queryString}` : `/${page === 'home' ? '' : page}`;
    window.history.pushState({}, '', url);
  };
}

export function useRoute() {
  const [route, setRoute] = useState<RouteState>(currentRoute);

  useEffect(() => {
    const unsubscribe = subscribeToRoute(setRoute);

    // Handle browser back/forward
    const handlePopState = () => {
      const hash = window.location.pathname;
      const parts = hash.split('/').filter(Boolean);
      const page = (parts[0] || 'home') as Page;

      const params: Record<string, string> = {};
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.forEach((value, key) => {
        params[key] = value;
      });

      currentRoute = { page, params };
      emitRouteChange();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      unsubscribe();
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  return route;
}

export function initializeRouter() {
  const path = window.location.pathname;
  const parts = path.split('/').filter(Boolean);
  const page = (parts[0] || 'home') as Page;

  const params: Record<string, string> = {};
  const searchParams = new URLSearchParams(window.location.search);
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  currentRoute = { page, params };
}
