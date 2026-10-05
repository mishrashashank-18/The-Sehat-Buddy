// backend/controllers/mapController.js

/**
 * Controller to fetch driving route between user origin and hospital destination.
 * Uses OpenRouteService with public OpenStreetMap (OSRM) as a resilient fallback.
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

    const apiKey = process.env.OPENROUTESERVICE_API_KEY;
    const provider = process.env.MAP_ROUTING_PROVIDER || 'openrouteservice';

    let routeData = null;

    // 1. Attempt OpenRouteService if API key is provided
    if (apiKey && apiKey.trim().length > 0) {
      try {
        const orsUrl = `https://api.openrouteservice.org/v2/directions/driving-car/geojson`;
        const orsRes = await fetch(orsUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': apiKey.trim()
          },
          body: JSON.stringify({
            coordinates: [
              [originLng, originLat],
              [destLng, destLat]
            ]
          })
        });

        if (orsRes.ok) {
          const orsJson = await orsRes.json();
          if (orsJson.features && orsJson.features.length > 0) {
            const feature = orsJson.features[0];
            const coordinates = feature.geometry.coordinates.map(coord => [coord[1], coord[0]]); // [lat, lng]
            const distanceMeters = feature.properties.summary.distance;
            const durationSeconds = feature.properties.summary.duration;

            routeData = {
              provider: 'openrouteservice',
              coordinates,
              distanceMeters,
              durationSeconds
            };
          }
        } else {
          console.warn(`[MapController] ORS returned status ${orsRes.status}. Falling back to OSRM.`);
        }
      } catch (orsErr) {
        console.warn(`[MapController] ORS request failed: ${orsErr.message}. Falling back to OSRM.`);
      }
    }

    // 2. Fallback to OpenStreetMap OSRM routing if ORS was not used or failed
    if (!routeData) {
      try {
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson`;
        const osrmRes = await fetch(osrmUrl);

        if (osrmRes.ok) {
          const osrmJson = await osrmRes.json();
          if (osrmJson.routes && osrmJson.routes.length > 0) {
            const route = osrmJson.routes[0];
            // OSRM coordinates are [lng, lat] -> convert to Leaflet [lat, lng]
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

    // If both failed, return an error
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
