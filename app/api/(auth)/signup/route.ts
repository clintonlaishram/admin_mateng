import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const signupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  address: z.string().min(1, 'Address is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = signupSchema.parse(body);

    const lastUser = await prisma.users.findFirst({
      where: { vendor_id: { not: null } }, // Exclude null vendor_id
      orderBy: { vendor_id: 'desc' },
      select: { vendor_id: true },
    });
    const nextVendorId = lastUser && lastUser.vendor_id !== null ? lastUser.vendor_id + 1 : 1;

    await prisma.users.create({
      data: {
        name: parsed.name,
        email: parsed.email,
        password: parsed.password,
        phone: parsed.phone,
        address: parsed.address,
        is_registered: false,
        is_business_owner: false,
        vendor_id: nextVendorId,
      },
    });

    return NextResponse.json({ message: 'User created successfully' }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid input: ' + error.errors.map((e) => e.message).join(', ') },
        { status: 400 }
      );
    }
    console.error('Create user error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}