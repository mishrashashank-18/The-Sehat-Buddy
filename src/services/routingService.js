// src/services/routingService.js
import { API_BASE } from './api';

/**
 * Fetch road route between origin and destination.
 * 
 * @param {Object} origin - { latitude, longitude } or { lat, lng }
 * @param {Object} destination - { latitude, longitude } or { lat, lng }
 * @returns {Promise<{
 *   success: boolean,
 *   coordinates: Array<[number, number]>, // [[lat, lng], ...]
 *   distance: string, // e.g. "4.8 km"
 *   duration: string, // e.g. "14 min"
 *   provider: string
 * }>}
 */
export async function getRoute(origin, destination) {
  const originLat = origin.latitude ?? origin.lat;
  const originLng = origin.longitude ?? origin.lng;
  const destLat = destination.latitude ?? destination.lat;
  const destLng = destination.longitude ?? destination.lng;

  if (
    originLat == null || originLng == null ||
    destLat == null || destLng == null ||
    isNaN(Number(originLat)) || isNaN(Number(originLng)) ||
    isNaN(Number(destLat)) || isNaN(Number(destLng))
  ) {
    throw new Error('Invalid origin or destination coordinates.');
  }

  // 1. Try Backend API route endpoint (preferred - keeps API keys private)
  try {
    const params = new URLSearchParams({
      originLatitude: originLat,
      originLongitude: originLng,
      destinationLatitude: destLat,
      destinationLongitude: destLng
    });

    const res = await fetch(`${API_BASE}/maps/route?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.coordinates && data.coordinates.length > 0) {
        return {
          success: true,
          coordinates: data.coordinates,
          distance: data.distance,
          duration: data.duration,
          provider: data.provider || 'openrouteservice'
        };
      }
    }
  } catch (backendErr) {
    console.warn('[RoutingService] Backend routing proxy call failed, falling back to direct OSM routing:', backendErr);
  }

  // 2. Client-side fallback to OpenStreetMap OSRM router
  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson`;
    const res = await fetch(osrmUrl);
    if (!res.ok) {
      throw new Error(`OSRM request failed with status ${res.status}`);
    }

    const data = await res.json();
    if (!data.routes || data.routes.length === 0) {
      throw new Error('No road route found between the coordinates.');
    }

    const route = data.routes[0];
    const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]); // [lat, lng]
    const distanceKm = (route.distance / 1000).toFixed(1);
    const totalMinutes = Math.round(route.duration / 60);
    const durationText = totalMinutes < 60
      ? `${Math.max(1, totalMinutes)} min`
      : `${Math.floor(totalMinutes / 60)} hr ${totalMinutes % 60 > 0 ? (totalMinutes % 60) + ' min' : ''}`.trim();

    return {
      success: true,
      coordinates,
      distance: `${distanceKm} km`,
      duration: durationText,
      provider: 'osrm_osm'
    };
  } catch (err) {
    console.error('[RoutingService] Failed to calculate route:', err);
    throw new Error(err.message || 'Unable to calculate road route.');
  }
}

export default {
  getRoute
};
