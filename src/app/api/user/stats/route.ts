import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        rides: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    const totalRides = user.rides.length;
    const totalDistance = user.rides.reduce((sum, ride) => sum + (ride.distance || 0), 0);
    const totalTime = user.rides.reduce((sum, ride) => {
      if (ride.endTime) {
        return sum + (ride.endTime.getTime() - ride.startTime.getTime());
      }
      return sum;
    }, 0);
    const averageSpeed = totalRides > 0
      ? user.rides.reduce((sum, ride) => sum + (ride.averageSpeed || 0), 0) / totalRides
      : 0;

    return NextResponse.json({
      totalRides,
      totalDistance,
      totalTime,
      averageSpeed,
    });
  } catch (error) {
    console.error('İstatistik hatası:', error);
    return NextResponse.json(
      { message: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
} 