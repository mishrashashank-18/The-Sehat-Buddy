// backend/controllers/mapController.js

/**
 * Decode Google Encoded Polyline string into Leaflet [[lat, lng], ...] coordinates.
 * Reference: Google Polyline Encoding Algorithm format.
 */
function decodePolyline(encoded) {
  if (!encoded) return [];
  const points = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

/**
 * Controller to fetch driving route between user origin and hospital destination.
 * Uses official Google Maps Routes API with live traffic awareness, with OpenStreetMap (OSRM) as resilient fallback.
 */
export const getRoute = async (req, res) => {
  try {
    const originLat = parseFloat(req.query.originLatitude || req.query.originLat || req.query.origin_lat || req.query.startLat);
    const originLng = parseFloat(req.query.originLongitude || req.query.originLng || req.query.origin_lng || req.query.startLng);
    const destLat = parseFloat(req.query.destinationLatitude || req.query.destinationLat || req.query.destLat || req.query.dest_lat || req.query.endLat);
    const destLng = parseFloat(req.query.destinationLongitude || req.query.destinationLng || req.query.destLng || req.query.dest_lng || req.query.endLng);

    if (isNaN(originLat) || isNaN(originLng) || isNaN(destLat) || isNaN(destLng)) {
      return res.status(400).json({
        success: false,
        message: 'Valid origin and destination coordinates (latitude, longitude) are required.'
      });
    }

    const googleApiKey = (process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAP_API_KEY || '').trim();
    let routeData = null;

    // 1. Primary: Google Maps Routes API (live traffic aware driving directions)
    if (googleApiKey.length > 0) {
      try {
        const routesUrl = 'https://routes.googleapis.com/directions/v2:computeRoutes';
        const googleRes = await fetch(routesUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': googleApiKey,
            'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline'
          },
          body: JSON.stringify({
            origin: {
              location: {
                latLng: {
                  latitude: originLat,
                  longitude: originLng
                }
              }
            },
            destination: {
              location: {
                latLng: {
                  latitude: destLat,
                  longitude: destLng
                }
              }
            },
            travelMode: 'DRIVE',
            routingPreference: 'TRAFFIC_AWARE'
          })
        });

        if (googleRes.ok) {
          const googleJson = await googleRes.json();
          if (googleJson.routes && googleJson.routes.length > 0) {
            const route = googleJson.routes[0];
            const coordinates = decodePolyline(route.polyline?.encodedPolyline || '');
            const distanceMeters = route.distanceMeters || 0;
            const durationSeconds = parseInt(String(route.duration || '0').replace('s', ''), 10) || 0;

            if (coordinates.length > 0) {
              routeData = {
                provider: 'google',
                coordinates,
                distanceMeters,
                durationSeconds
              };
            }
          }
        } else {
          const errText = await googleRes.text().catch(() => '');
          console.warn(`[MapController] Google Routes API status ${googleRes.status}: ${errText}. Falling back to OSRM.`);
        }
      } catch (googleErr) {
        console.warn(`[MapController] Google Routes API request failed: ${googleErr.message}. Falling back to OSRM.`);
      }
    }

    // 2. Resilient Fallback: OpenStreetMap OSRM routing
    if (!routeData) {
      try {
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson`;
        const osrmRes = await fetch(osrmUrl);

        if (osrmRes.ok) {
          const osrmJson = await osrmRes.json();
          if (osrmJson.routes && osrmJson.routes.length > 0) {
            const route = osrmJson.routes[0];
            const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
            const distanceMeters = route.distance;
            const durationSeconds = route.duration;

            routeData = {
              provider: 'osrm_osm',
              coordinates,
              distanceMeters,
              durationSeconds
            };
          }
        }
      } catch (osrmErr) {
        console.error(`[MapController] OSRM fallback error: ${osrmErr.message}`);
      }
    }

    if (!routeData) {
      return res.status(502).json({
        success: false,
        message: 'Could not calculate route between the provided locations. Please verify coordinates and try again.'
      });
    }

    // Format human-friendly distance and duration
    const distanceKm = (routeData.distanceMeters / 1000).toFixed(1);
    const distanceText = `${distanceKm} km`;

    const totalMinutes = Math.round(routeData.durationSeconds / 60);
    let etaText = '';
    if (totalMinutes < 60) {
      etaText = `${Math.max(1, totalMinutes)} min`;
    } else {
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      etaText = mins > 0 ? `${hours} hr ${mins} min` : `${hours} hr`;
    }

    return res.json({
      success: true,
      provider: routeData.provider,
      distance: distanceText,
      distanceMeters: routeData.distanceMeters,
      duration: etaText,
      durationSeconds: routeData.durationSeconds,
      coordinates: routeData.coordinates
    });
  } catch (error) {
    console.error('[MapController] Unexpected error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while calculating route.'
    });
  }
};
