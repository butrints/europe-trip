import { createRouter, createWebHashHistory } from 'vue-router';

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'trips', component: () => import('./views/TripsView.vue') },
    {
      path: '/t/:slug',
      component: () => import('./views/TripLayout.vue'),
      children: [
        { path: '', name: 'plan', component: () => import('./views/PlanView.vue') },
        { path: 'explore', name: 'explore', component: () => import('./views/ExploreView.vue') },
        { path: 'place/:id', name: 'place', component: () => import('./views/PlaceView.vue') },
        { path: 'map', name: 'map', component: () => import('./views/MapView.vue') },
        { path: 'transit', name: 'transit', component: () => import('./views/TransitView.vue') },
        { path: 'info', name: 'info', component: () => import('./views/InfoView.vue') },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior(to, from, saved) {
    if (saved) return saved;
    if (to.name === from.name && to.params.slug === from.params.slug) return undefined;
    return { top: 0 };
  },
});
