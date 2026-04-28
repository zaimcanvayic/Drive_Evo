import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    console.log('POST /api/user/rides başladı');
    
    const session = await getServerSession(authOptions);
    console.log('Session:', session);

    if (!session?.user?.id) {
      console.log('Oturum bulunamadı');
      return NextResponse.json(
        { message: 'Oturum açmanız gerekiyor' },
        { status: 401 }
      );
    }

    const body = await req.json();
    console.log('Gelen veri:', body);

    const { score, driveId } = body;

    if (typeof score !== 'number' || score < 0 || score > 100) {
      console.log('Geçersiz puan:', score);
      return NextResponse.json(
        { message: 'Geçerli bir puan gerekli (0-100 arası)' },
        { status: 400 }
      );
    }

    console.log('Veritabanına kayıt başlıyor...');
    
    // Önce mevcut sürüşü bul
    const existingRide = await prisma.ride.findFirst({
      where: {
        userId: session.user.id,
        driveId: driveId
      }
    });

    let ride;
    if (existingRide) {
      // Mevcut sürüşü güncelle
      ride = await prisma.ride.update({
        where: { id: existingRide.id },
        data: {
          score: Math.round(score),
        },
      });
    } else {
      // Yeni sürüş oluştur
      ride = await prisma.ride.create({
        data: {
          userId: session.user.id,
          driveId: driveId,
          startTime: new Date(),
          score: Math.round(score),
          averageSpeed: 0,
          maxSpeed: 0,
          fuelEfficiency: 0,
        },
      });
    }

    console.log('Kayıt başarılı:', ride);

    return NextResponse.json(ride, { status: 201 });
  } catch (error) {
    console.error('Ride creation error:', error);
    return NextResponse.json(
      { message: 'Sürüş kaydedilemedi', error: error instanceof Error ? error.message : 'Bilinmeyen hata' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Oturum açmanız gerekiyor' },
        { status: 401 }
      );
    }

    const rides = await prisma.ride.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    return NextResponse.json(rides);
  } catch (error) {
    console.error('Rides fetch error:', error);
    return NextResponse.json(
      { message: 'Sürüşler getirilemedi' },
      { status: 500 }
    );
  }
} 