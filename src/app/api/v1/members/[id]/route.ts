import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAPIMiddleware, createAPIResponse } from '@/lib/api-middleware';
import { transformMemberForAPI } from '@/lib/api-transformers';
import { z } from 'zod';

const ProfileUpdateSchema = z.object({
  gender: z.string().optional(),
  email: z.string().email().optional(),
  phone_number: z.string().optional(),
  address: z.string().optional(),
  community: z.string().optional(),
  reserve_status: z.enum(['on_reserve','off_reserve']).optional(),
  image_url: z.string().url().optional(),
});
const ALLOWED_KEYS = new Set([
  'gender','email','phone_number','address','community','reserve_status','image_url'
]);

async function handleMember(req: NextRequest) {
  const id = req.nextUrl.pathname.split('/').pop();
  if (!id) {
    return NextResponse.json(createAPIResponse(null,'Member ID is required'),{ status:400 });
  }

  if (req.method === 'GET') {
    try {
      const member = await prisma.fnmember.findUnique({
        where: { id },
        select: {
          id: true,
          created: true,
          updated: true,
          birthdate: true,
          first_name: true,
          last_name: true,
          t_number: true,
          deceased: true,
          activated: true,
          profile: {
            select: {
              id: true,
              created: true,
              updated: true,
              gender: true,
              email: true,
              phone_number: true,
              address: true,
              community: true,
              o_r_status: true,
              image_url: true,
              fnmemberId: true,
            }
          },
          barcode: {
            select: {
              id: true,
              created: true,
              updated: true,
              barcode: true,
              activated: true,
              fnmemberId: true,
            },
            orderBy: { created: 'desc' }
          },
          family: {
            select: {
              id: true,
              created: true,
              updated: true,
              fnmemberId: true,
              spouse_fname: true,
              spouse_lname: true,
              dependents: true,
            }
          }
        }
      });
      if (!member) {
        return NextResponse.json(createAPIResponse(null,'Member not found'),{ status:404 });
      }
      return NextResponse.json(createAPIResponse(transformMemberForAPI(member)));
    } catch (e:any) {
      console.error('Member fetch error:', e);
      return NextResponse.json(createAPIResponse(null,'Failed to fetch member'),{ status:500 });
    }
  }

  if (['PATCH','PUT'].includes(req.method)) {
    try {
      const body = await req.json();
      const invalid = Object.keys(body).filter(k => !ALLOWED_KEYS.has(k));
      if (invalid.length) {
        return NextResponse.json(
          createAPIResponse(null,'Only profile fields may be updated',{ invalid_keys: invalid }),
          { status:400 }
        );
      }
      const parsed = ProfileUpdateSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          createAPIResponse(null,'Validation error',{ issues: parsed.error.issues }),
          { status:400 }
        );
      }
      const data = parsed.data;
      const existing = await prisma.fnmember.findUnique({
        where:{ id },
        include:{ profile:true, barcode:true, family:true }
      });
      if (!existing) {
        return NextResponse.json(createAPIResponse(null,'Member not found'),{ status:404 });
      }
      if (Object.keys(data).length === 0) {
        return NextResponse.json(
          createAPIResponse(transformMemberForAPI(existing),'No profile fields supplied',{ warning:true }),
          { status:200 }
        );
      }
      const profileData: any = {};
      if (data.gender !== undefined) profileData.gender = data.gender;
      if (data.email !== undefined) profileData.email = data.email;
      if (data.phone_number !== undefined) profileData.phone_number = data.phone_number;
      if (data.address !== undefined) profileData.address = data.address;
      if (data.community !== undefined) profileData.community = data.community;
      if (data.reserve_status !== undefined) profileData.o_r_status = data.reserve_status === 'on_reserve' ? 'onreserve' : 'offreserve';
      if (data.image_url !== undefined) profileData.image_url = data.image_url;

      if (existing.profile[0]) {
        await prisma.profile.update({ where:{ id: existing.profile[0].id }, data: profileData });
      } else {
        await prisma.profile.create({ data:{ ...profileData, fnmemberId: id, o_r_status: profileData.o_r_status || '' } });
      }

      const fresh = await prisma.fnmember.findUnique({
        where:{ id },
        include:{ profile:true, barcode:true, family:true }
      });
      return NextResponse.json(createAPIResponse(transformMemberForAPI(fresh!)));
    } catch (e:any) {
      console.error('Profile update error:', e);
      return NextResponse.json(createAPIResponse(null,'Failed to update profile'),{ status:500 });
    }
  }

  return NextResponse.json(createAPIResponse(null,'Method not allowed'),{ status:405 });
}

export const GET = withAPIMiddleware(handleMember);
export const PATCH = withAPIMiddleware(handleMember);
export const PUT = withAPIMiddleware(handleMember);