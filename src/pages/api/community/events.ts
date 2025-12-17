import { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Yaklaşan etkinlikleri getir
      const result = await pool.query(
        `SELECT 
          e.id,
          e.title,
          e.description,
          e.event_datetime,
          e.reminder_count,
          u.full_name as presenter_name,
          u.profile_picture_url as presenter_image
        FROM events e
        LEFT JOIN users u ON e.presenter_user_id = u.id
        WHERE e.event_datetime > NOW()
        ORDER BY e.event_datetime ASC
        LIMIT 10`
      );

      res.status(200).json({ events: result.rows });
    } catch (error) {
      console.error('Events fetch error:', error);
      res.status(200).json({ events: [] });
    }
  } else if (req.method === 'POST') {
    try {
      const { title, description, event_datetime, presenter_user_id } = req.body;

      if (!title || !event_datetime) {
        return res.status(400).json({ error: 'title ve event_datetime gerekli' });
      }

      const result = await pool.query(
        `INSERT INTO events (title, description, event_datetime, presenter_user_id)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [title, description || null, event_datetime, presenter_user_id || null]
      );

      res.status(201).json({ event: result.rows[0] });
    } catch (error) {
      console.error('Event create error:', error);
      res.status(500).json({ error: 'Etkinlik oluşturulurken hata oluştu' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
