/**
 * Seed initial : importe la feuille de route actuellement mockée
 * (src/features/roadmap/mockData.ts) dans la base Supabase.
 *
 * Réutilise directement les données existantes => aucune perte, aucune
 * duplication de source. Idempotent : purge le projet puis réinsère.
 *
 * Lancement :  npm run db:seed
 * Requiert SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (clé serveur, contourne RLS).
 */
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import WebSocket from 'ws'
import { mockRoadmap } from '../src/features/roadmap/mockData'

const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const projectId = process.env.VITE_PROJECT_ID?.trim() || 'tehazed'

if (!url || !serviceKey) {
  console.error('❌ SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis (voir .env).')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  // Node < 22 n'a pas de WebSocket natif : on fournit `ws` pour l'init du
  // client realtime (non utilisé par le seed, mais instancié au démarrage).
  realtime: { transport: WebSocket as unknown as never },
})

function check<T>(label: string, res: { error: unknown; data?: T }) {
  if (res.error) {
    console.error(`❌ ${label}:`, res.error)
    process.exit(1)
  }
}

async function seed() {
  const r = mockRoadmap
  console.log(`▶︎ Seed du projet « ${r.projectName} » (id: ${projectId})`)

  // Purge (cascade depuis chaque table racine du projet).
  await supabase.from('days').delete().eq('project_id', projectId)
  await supabase.from('people').delete().eq('project_id', projectId)
  await supabase.from('vehicles').delete().eq('project_id', projectId)
  await supabase.from('checklist_categories').delete().eq('project_id', projectId)

  check(
    'projects',
    await supabase.from('projects').upsert({
      id: projectId,
      name: r.projectName,
      subtitle: r.subtitle,
      version: r.version,
      statut: 'En cours',
    }),
  )

  for (const [di, day] of r.days.entries()) {
    check(
      `day ${day.id}`,
      await supabase.from('days').insert({
        id: day.id,
        project_id: projectId,
        label: day.label,
        date: day.date || null,
        subtitle: day.subtitle ?? null,
        ordre: di,
      }),
    )

    if (day.steps.length) {
      check(
        `steps ${day.id}`,
        await supabase.from('steps').insert(
          day.steps.map((s, si) => ({
            id: s.id,
            day_id: day.id,
            title: s.title,
            phase: s.phase,
            start_at: s.start || null,
            end_at: s.end || null,
            location: s.location ?? null,
            participants: s.participants,
            equipment: s.equipment,
            vehicles: s.vehicles,
            details: s.details,
            override: s.override,
            shift_minutes: s.shiftMinutes,
            ordre: si,
          })),
        ),
      )

      const comments = day.steps.flatMap((s) =>
        s.comments.map((c) => ({
          id: c.id,
          step_id: s.id,
          author: c.author,
          text: c.text,
          created_at: c.createdAt,
        })),
      )
      if (comments.length) check('comments', await supabase.from('comments').insert(comments))
    }
  }

  check(
    'people',
    await supabase.from('people').insert(
      r.team.map((p, i) => ({
        id: p.id,
        project_id: projectId,
        name: p.name,
        role: p.role,
        phone: p.phone ?? null,
        availability: p.availability ?? null,
        vehicle: p.vehicle ?? null,
        ordre: i,
      })),
    ),
  )

  check(
    'vehicles',
    await supabase.from('vehicles').insert(
      r.vehicles.map((v, i) => ({
        id: v.id,
        project_id: projectId,
        name: v.name,
        driver: v.driver ?? null,
        passengers: v.passengers,
        cargo: v.cargo,
        ordre: i,
      })),
    ),
  )

  for (const [ci, cat] of r.checklists.entries()) {
    check(
      `checklist_categories ${cat.id}`,
      await supabase
        .from('checklist_categories')
        .insert({ id: cat.id, project_id: projectId, name: cat.name, ordre: ci }),
    )
    if (cat.items.length) {
      check(
        `checklist_items ${cat.id}`,
        await supabase.from('checklist_items').insert(
          cat.items.map((it, ii) => ({
            id: it.id,
            category_id: cat.id,
            label: it.label,
            checked: it.checked,
            ordre: ii,
          })),
        ),
      )
    }
  }

  // Relations N-N : meilleure correspondance par nom (personnes / matériel).
  await linkRelations(r)

  console.log('✅ Seed terminé avec succès.')
  process.exit(0)
}

/** Lie les étapes aux personnes via correspondance de nom (best-effort). */
async function linkRelations(r: typeof mockRoadmap) {
  const peopleByName = new Map(r.team.map((p) => [p.name.toLowerCase(), p.id]))
  const links: { step_id: string; person_id: string }[] = []
  for (const day of r.days) {
    for (const step of day.steps) {
      for (const name of step.participants) {
        const personId = peopleByName.get(name.toLowerCase())
        if (personId) links.push({ step_id: step.id, person_id: personId })
      }
    }
  }
  if (links.length) {
    const res = await supabase.from('step_people').upsert(links, { ignoreDuplicates: true })
    if (res.error) console.warn('⚠︎ step_people:', res.error.message)
  }
}

seed().catch((e) => {
  console.error('❌ Seed échoué:', e)
  process.exit(1)
})
