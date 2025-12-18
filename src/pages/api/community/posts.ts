import { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Tüm herkese açık postları getir (en yeni önce)
      const result = await pool.query(
        `SELECT 
          p.id,
          p.user_id,
          p.content_text,
          p.image_url,
          p.post_type,
          p.created_at,
          p.like_count,
          p.comment_count,
          p.share_count,
          p.view_count,
          u.full_name as user_name,
          u.email as user_email,
          u.profile_picture_url,
          u.is_verified
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.is_public = TRUE
        ORDER BY p.created_at DESC
        LIMIT 50`
      );

      res.status(200).json({ posts: result.rows });
    } catch (error) {
      console.error('Posts fetch error:', error);
      res.status(500).json({ error: 'Postlar yüklenirken hata oluştu' });
    }
  } else if (req.method === 'POST') {
    let responseSent = false;
    
    try {
      const { user_id, content_text, image_url, post_type } = req.body;

      console.log('Post create request:', { user_id, content_length: content_text?.length, post_type });

      if (!user_id || !content_text) {
        responseSent = true;
        return res.status(400).json({ error: 'user_id ve content_text gerekli' });
      }

      // İçerik boş mu kontrol et
      if (!content_text.trim()) {
        responseSent = true;
        return res.status(400).json({ error: 'Post içeriği boş olamaz' });
      }

      // Kullanıcının var olup olmadığını kontrol et
      console.log('Checking user existence...');
      const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [user_id]);
      if (userCheck.rows.length === 0) {
        responseSent = true;
        return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
      }

      // Post'u ekle - herhangi bir kısıtlama yok, istediği kadar post paylaşabilir
      // created_at ve sayılar için DEFAULT değerleri kullan
      console.log('Inserting post...');
      const result = await pool.query(
        `INSERT INTO posts (user_id, content_text, image_url, post_type, is_public)
         VALUES ($1, $2, $3, $4, TRUE)
         RETURNING *`,
        [user_id, content_text.trim(), image_url || null, post_type || 'text']
      );

      console.log('Post inserted, ID:', result.rows[0]?.id);

      // Kullanıcı bilgilerini de ekle
      const userResult = await pool.query(
        'SELECT id, full_name, email, profile_picture_url, is_verified FROM users WHERE id = $1',
        [user_id]
      );

      const post = result.rows[0];
      const user = userResult.rows[0];

      console.log('Sending success response...');
      responseSent = true;
      
      const responseData = {
        post: {
          ...post,
          user_name: user?.full_name || user?.email?.split('@')[0] || 'Kullanıcı',
          user_email: user?.email,
          profile_picture_url: user?.profile_picture_url,
          is_verified: user?.is_verified || false,
        },
      };
      
      console.log('Response data prepared, sending...');
      res.status(201).json(responseData);
      console.log('Response sent successfully');
    } catch (error: any) {
      console.error('Post create error:', error);
      
      // Response zaten gönderilmişse tekrar gönderme
      if (responseSent) {
        console.error('Response already sent, cannot send error response');
        return;
      }
      
      // Veritabanı hatalarını daha detaylı göster
      if (error.code === '23505') {
        // Unique constraint violation
        responseSent = true;
        return res.status(400).json({ error: 'Bu post zaten mevcut' });
      } else if (error.code === '23503') {
        // Foreign key violation
        responseSent = true;
        return res.status(400).json({ error: 'Geçersiz kullanıcı ID' });
      } else if (error.code === '23502') {
        // Not null violation
        responseSent = true;
        return res.status(400).json({ error: 'Gerekli alanlar eksik' });
      }
      
      // Daha açıklayıcı hata mesajı
      const errorMessage = error.message || 'Post oluşturulurken hata oluştu';
      console.error('Post create error details:', {
        code: error.code,
        message: error.message,
        detail: error.detail,
        constraint: error.constraint
      });
      
      responseSent = true;
      res.status(500).json({ 
        error: errorMessage,
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? {
          code: error.code,
          message: error.message,
          detail: error.detail,
          constraint: error.constraint
        } : undefined
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
