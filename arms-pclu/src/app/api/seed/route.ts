import { NextResponse } from 'next/server'
import { seedAdminAccount } from '@/lib/auth/seedAdmin'

export async function GET() {
  // Block in production environment
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Forbidden in production' },
      { status: 403 }
    )
  }

  try {
    await seedAdminAccount()
    return NextResponse.json({
      success: true,
      message: 'Admin account seeded successfully.',
      credentials: {
        email: 'admin@pclu.edu.ph',
        password: 'ARMS@Admin2025!',
        warning: 'Change this password after first login!',
      },
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      {
        error: 'Seed failed',
        details: error instanceof Error
          ? error.message
          : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
