const express = require('express');
const { query } = require('../config/database');

const router = express.Router();

// Get service providers
router.get('/', async (req, res) => {
  try {
    const { city, state, services, latitude, longitude, radius = 50 } = req.query;

    let sql = `
      SELECT id, name, description, phone, email, website,
             address, city, state, zip_code, latitude, longitude,
             services, rating, review_count
      FROM service_providers
      WHERE is_active = TRUE
    `;
    const params = [];
    let paramIndex = 1;

    if (city) {
      sql += ` AND LOWER(city) = LOWER($${paramIndex})`;
      params.push(city);
      paramIndex++;
    }

    if (state) {
      sql += ` AND LOWER(state) = LOWER($${paramIndex})`;
      params.push(state);
      paramIndex++;
    }

    if (services) {
      sql += ` AND services ILIKE $${paramIndex}`;
      params.push(`%${services}%`);
      paramIndex++;
    }

    // Distance calculation if lat/lng provided
    if (latitude && longitude) {
      sql = `
        SELECT *, 
        (3959 * acos(cos(radians($${paramIndex})) * cos(radians(latitude)) * 
        cos(radians(longitude) - radians($${paramIndex + 1})) + 
        sin(radians($${paramIndex})) * sin(radians(latitude)))) AS distance
        FROM (${sql}) AS providers
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL
        HAVING distance < $${paramIndex + 2}
        ORDER BY distance ASC
      `;
      params.push(parseFloat(latitude), parseFloat(longitude), parseFloat(radius));
    } else {
      sql += ' ORDER BY rating DESC, review_count DESC';
    }

    sql += ' LIMIT 50';

    const result = await query(sql, params);

    const providers = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      phone: row.phone,
      email: row.email,
      website: row.website,
      address: row.address,
      city: row.city,
      state: row.state,
      zipCode: row.zip_code,
      latitude: row.latitude ? parseFloat(row.latitude) : null,
      longitude: row.longitude ? parseFloat(row.longitude) : null,
      services: row.services,
      rating: row.rating ? parseFloat(row.rating) : null,
      reviewCount: row.review_count,
      distance: row.distance ? parseFloat(row.distance).toFixed(1) : null
    }));

    res.json(providers);
  } catch (error) {
    console.error('Get providers error:', error);
    res.status(500).json({ error: 'failed_to_get_providers' });
  }
});

module.exports = router;
