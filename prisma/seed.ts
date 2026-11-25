import { PrismaClient, SkillCategory, ProjectStatus, AdminRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // 1. Upsert Admin Account
  const adminEmail = process.env.ADMIN_EMAIL || 'salemzaafrou@gmail.com'
  const adminPassword = process.env.ADMIN_PASSWORD || 'StrongPassword@2026'
  const passwordHash = await bcrypt.hash(adminPassword, 12)

  const admin = await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      role: AdminRole.SUPER_ADMIN,
      isActive: true,
    },
    create: {
      email: adminEmail,
      passwordHash,
      role: AdminRole.SUPER_ADMIN,
      isActive: true,
    },
  })
  console.log(`✅ Admin account upserted: ${admin.email}`)

  // 2. Upsert Profile
  const profileEmail = 'salemzaafrou@gmail.com'
  const profileData = {
    fullName: 'Salem Zaafrou',
    headline: 'Full-Stack Web Developer & Cybersecurity Enthusiast',
    bio: 'Full-Stack Web Developer & Cybersecurity Enthusiast based in Marrakech, Morocco. Passionate about building secure, scalable, and high-performance digital solutions with modern web frameworks and robust cloud architectures.',
    email: profileEmail,
    phone: '+212 600-000000',
    location: 'Marrakech, Morocco',
    githubUrl: 'https://github.com/Salem-1822',
    linkedinUrl: 'https://linkedin.com/in/salem-zaafrou',
    avatarUrl: 'https://github.com/Salem-1822.png',
  }

  const existingProfile = await prisma.profile.findFirst({
    where: { email: profileEmail },
  })

  const profile = existingProfile
    ? await prisma.profile.update({
        where: { id: existingProfile.id },
        data: profileData,
      })
    : await prisma.profile.create({
        data: profileData,
      })
  console.log(`✅ Profile upserted: ${profile.fullName}`)

  // 3. Upsert 8 Skills across all categories
  const skillsToSeed = [
    { name: 'Next.js', category: SkillCategory.FRONTEND, level: 92, icon: 'nextjs', displayOrder: 1 },
    { name: 'TypeScript', category: SkillCategory.FRONTEND, level: 90, icon: 'typescript', displayOrder: 2 },
    { name: 'React', category: SkillCategory.FRONTEND, level: 92, icon: 'react', displayOrder: 3 },
    { name: 'Laravel 12', category: SkillCategory.BACKEND, level: 95, icon: 'laravel', displayOrder: 4 },
    { name: 'PHP 8.2', category: SkillCategory.BACKEND, level: 90, icon: 'php', displayOrder: 5 },
    { name: 'PostgreSQL', category: SkillCategory.DATABASE, level: 88, icon: 'postgresql', displayOrder: 6 },
    { name: 'Docker', category: SkillCategory.DEVOPS_TOOLS, level: 85, icon: 'docker', displayOrder: 7 },
    { name: 'Kali Linux / Threat Modeling', category: SkillCategory.SECURITY, level: 85, icon: 'shield', displayOrder: 8 },
  ]

  const skillMap: Record<string, string> = {}
  for (const s of skillsToSeed) {
    const existing = await prisma.skill.findFirst({ where: { name: s.name } })
    const skill = existing
      ? await prisma.skill.update({ where: { id: existing.id }, data: s })
      : await prisma.skill.create({ data: s })
    skillMap[s.name] = skill.id
    console.log(`  - Skill [${s.category}]: ${s.name}`)
  }
  console.log(`✅ ${skillsToSeed.length} Skills upserted successfully`)

  // 4. Upsert Education
  const educationData = {
    institution: 'OFPPT Marrakech',
    degree: 'Diplôme de Technicien Spécialisé',
    fieldOfStudy: 'Digital Development - Web Full Stack',
    description: 'Comprehensive program focused on modern full-stack web development, software engineering principles, relational databases, RESTful APIs, and application security.',
    startDate: new Date('2024-09-01T00:00:00.000Z'),
    endDate: new Date('2026-06-30T00:00:00.000Z'),
    isCurrent: false,
    displayOrder: 1,
  }

  const existingEducation = await prisma.education.findFirst({
    where: {
      institution: educationData.institution,
      degree: educationData.degree,
    },
  })

  const education = existingEducation
    ? await prisma.education.update({
        where: { id: existingEducation.id },
        data: educationData,
      })
    : await prisma.education.create({
        data: educationData,
      })
  console.log(`✅ Education upserted: ${education.degree} at ${education.institution}`)

  // 5. Upsert Experience and link to skills via ExperienceSkill
  const experienceData = {
    company: 'Freelance & Independent Projects',
    position: 'Full-Stack Developer & Software Engineer',
    description: 'Developed modern web applications and API architectures utilizing Next.js, React, Laravel, and PostgreSQL. Implemented secure authentication, CI/CD containerization with Docker, and security audits.',
    location: 'Marrakech, Morocco',
    startDate: new Date('2024-01-01T00:00:00.000Z'),
    endDate: null,
    isCurrent: true,
    displayOrder: 1,
  }

  const existingExperience = await prisma.experience.findFirst({
    where: {
      company: experienceData.company,
      position: experienceData.position,
    },
  })

  const experience = existingExperience
    ? await prisma.experience.update({
        where: { id: existingExperience.id },
        data: experienceData,
      })
    : await prisma.experience.create({
        data: experienceData,
      })

  const experienceSkillNames = ['Next.js', 'TypeScript', 'React', 'Laravel 12', 'PostgreSQL', 'Docker']
  for (const name of experienceSkillNames) {
    const skillId = skillMap[name]
    if (skillId) {
      await prisma.experienceSkill.upsert({
        where: {
          experienceId_skillId: {
            experienceId: experience.id,
            skillId,
          },
        },
        update: {},
        create: {
          experienceId: experience.id,
          skillId,
        },
      })
    }
  }
  console.log(`✅ Experience upserted: ${experience.position} at ${experience.company} with linked skills`)

  // 6. Upsert Projects and link to skills via ProjectSkill
  const project1Data = {
    title: 'HotelBooking Platform',
    slug: 'hotelbooking-platform',
    description: 'A full-featured hotel booking and reservation web platform with real-time room availability, secure booking flows, responsive UI, and backend administrative management.',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    githubUrl: 'https://github.com/Salem-1822/HotelBooking',
    liveUrl: 'https://hotelbooking.wasmer.app',
    featured: true,
    status: ProjectStatus.COMPLETED,
    displayOrder: 1,
  }

  const project1 = await prisma.project.upsert({
    where: { slug: project1Data.slug },
    update: project1Data,
    create: project1Data,
  })

  const project1SkillNames = ['Laravel 12', 'PHP 8.2', 'PostgreSQL', 'React', 'TypeScript']
  for (const name of project1SkillNames) {
    const skillId = skillMap[name]
    if (skillId) {
      await prisma.projectSkill.upsert({
        where: {
          projectId_skillId: {
            projectId: project1.id,
            skillId,
          },
        },
        update: {},
        create: {
          projectId: project1.id,
          skillId,
        },
      })
    }
  }
  console.log(`✅ Project upserted: ${project1.title} with linked skills`)

  const project2Data = {
    title: 'School Management System',
    slug: 'school-management-system',
    description: 'An all-in-one educational management system facilitating student tracking, course enrollment, grade reporting, attendance monitoring, and administrative workflows.',
    imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80',
    githubUrl: 'https://github.com/Salem-1822/school-mangment',
    liveUrl: null,
    featured: true,
    status: ProjectStatus.COMPLETED,
    displayOrder: 2,
  }

  const project2 = await prisma.project.upsert({
    where: { slug: project2Data.slug },
    update: project2Data,
    create: project2Data,
  })

  const project2SkillNames = ['Laravel 12', 'PHP 8.2', 'PostgreSQL', 'Next.js', 'TypeScript']
  for (const name of project2SkillNames) {
    const skillId = skillMap[name]
    if (skillId) {
      await prisma.projectSkill.upsert({
        where: {
          projectId_skillId: {
            projectId: project2.id,
            skillId,
          },
        },
        update: {},
        create: {
          projectId: project2.id,
          skillId,
        },
      })
    }
  }
  console.log(`✅ Project upserted: ${project2.title} with linked skills`)

  console.log('✨ Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
