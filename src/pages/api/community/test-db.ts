import { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Veritabanı bağlantısını test et
    const connectionTest = await pool.query('SELECT NOW() as current_time');
    
    // Tabloların varlığını kontrol et
    const tables = [
      'users',
      'posts',
      'likes',
      'comments',
      'follows',
      'notifications',
      'events',
    ];

    const tableStatus: Record<string, boolean> = {};
    const missingTables: string[] = [];
    const existingTables: string[] = [];

    for (const table of tables) {
      try {
        const result = await pool.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          )`,
          [table]
        );
        const exists = result.rows[0].exists;
        tableStatus[table] = exists;
        if (exists) {
          existingTables.push(table);
        } else {
          missingTables.push(table);
        }
      } catch (error) {
        tableStatus[table] = false;
        missingTables.push(table);
      }
    }

    // Users tablosundaki kolonları kontrol et
    let usersColumns: string[] = [];
    try {
      const columnsResult = await pool.query(
        `SELECT column_name 
         FROM information_schema.columns 
         WHERE table_name = 'users' 
         AND table_schema = 'public'`
      );
      usersColumns = columnsResult.rows.map((row) => row.column_name);
    } catch (error) {
      console.error('Users columns check error:', error);
    }

    const requiredColumns = [
      'username',
      'profile_picture_url',
      'bio',
      'is_verified',
      'follower_count',
      'following_count',
    ];

    const missingColumns = requiredColumns.filter(
      (col) => !usersColumns.includes(col)
    );

    res.status(200).json({
      success: true,
      connection: {
        status: 'connected',
        currentTime: connectionTest.rows[0].current_time,
      },
      tables: {
        status: tableStatus,
        existing: existingTables,
        missing: missingTables,
        allExist: missingTables.length === 0,
      },
      usersTable: {
        columns: usersColumns,
        requiredColumns: requiredColumns,
        missingColumns: missingColumns,
        isReady: missingColumns.length === 0,
      },
      instructions: {
        ifMissingTables: missingTables.length > 0
          ? `Aşağıdaki SQL dosyasını çalıştırın: database/community_schema.sql`
          : null,
        ifMissingColumns: missingColumns.length > 0
          ? `Aşağıdaki SQL dosyasını çalıştırın: database/update_users_table.sql`
          : null,
      },
    });
  } catch (error: any) {
    console.error('Database test error:', error);
    res.status(500).json({
      success: false,
      error: 'Veritabanı bağlantı hatası',
      message: error.message,
      details: {
        checkEnv: 'POSTGRES_HOST, POSTGRES_DATABASE, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_PORT değişkenlerini kontrol edin',
      },
    });
  }
}
