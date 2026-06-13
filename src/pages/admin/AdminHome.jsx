import { useEffect, useState } from 'react'
import ImageField from '../../components/admin/ImageField'
import { ADMIN_BTN, ADMIN_INPUT, ADMIN_LABEL, ADMIN_PANEL } from '../../components/admin/adminStyles'
import {
  CONTENT_KEYS,
  homeHeroDefaults,
  homeJoinDefaults,
  homeMissionDefaults,
  pageHeroDefaults,
  seasonDefaults,
  socialLinksDefaults,
  SOCIAL_PLATFORMS,
  testimonialsDefaults,
  mergeContent,
} from '../../config/contentDefaults'
import { fetchSiteContent, upsertSiteContent } from '../../services/cms/siteContent'

function TextArea({ label, value, onChange, rows = 3 }) {
  return (
    <div>
      <label className={ADMIN_LABEL}>{label}</label>
      <textarea className={ADMIN_INPUT} rows={rows} value={value || ''} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

function TextField({ label, value, onChange }) {
  return (
    <div>
      <label className={ADMIN_LABEL}>{label}</label>
      <input className={ADMIN_INPUT} value={value || ''} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

export default function AdminHome() {
  const [hero, setHero] = useState(homeHeroDefaults)
  const [mission, setMission] = useState(homeMissionDefaults)
  const [join, setJoin] = useState(homeJoinDefaults)
  const [season, setSeason] = useState(seasonDefaults)
  const [pageHeroes, setPageHeroes] = useState(pageHeroDefaults)
  const [testimonials, setTestimonials] = useState(testimonialsDefaults.items)
  const [socialLinks, setSocialLinks] = useState(socialLinksDefaults)
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      fetchSiteContent(CONTENT_KEYS.homeHero),
      fetchSiteContent(CONTENT_KEYS.homeMission),
      fetchSiteContent(CONTENT_KEYS.homeJoin),
      fetchSiteContent(CONTENT_KEYS.settingsSeason),
      fetchSiteContent(CONTENT_KEYS.pageEventsHero),
      fetchSiteContent(CONTENT_KEYS.pageGalleryHero),
      fetchSiteContent(CONTENT_KEYS.pageBlogHero),
      fetchSiteContent(CONTENT_KEYS.homeTestimonials),
      fetchSiteContent(CONTENT_KEYS.settingsSocialLinks),
    ]).then(([h, m, j, s, pe, pg, pb, t, social]) => {
      setHero(mergeContent(homeHeroDefaults, h))
      setMission(mergeContent(homeMissionDefaults, m))
      setJoin(mergeContent(homeJoinDefaults, j))
      setSeason(mergeContent(seasonDefaults, s))
      setPageHeroes({
        events: mergeContent(pageHeroDefaults.events, pe),
        gallery: mergeContent(pageHeroDefaults.gallery, pg),
        blog: mergeContent(pageHeroDefaults.blog, pb),
      })
      if (t?.items) setTestimonials(t.items)
      setSocialLinks(mergeContent(socialLinksDefaults, social))
    }).catch((err) => setStatus(err.message))
  }, [])

  const save = async () => {
    setSaving(true)
    setStatus('')
    try {
      const cleanedTestimonials = testimonials
        .map((item) => ({
          quote: item.quote?.trim() || '',
          name: item.name?.trim() || '',
          role: item.role?.trim() || '',
        }))
        .filter((item) => item.quote && item.name)
      await Promise.all([
        upsertSiteContent(CONTENT_KEYS.homeHero, hero),
        upsertSiteContent(CONTENT_KEYS.homeMission, mission),
        upsertSiteContent(CONTENT_KEYS.homeJoin, join),
        upsertSiteContent(CONTENT_KEYS.settingsSeason, season),
        upsertSiteContent(CONTENT_KEYS.pageEventsHero, pageHeroes.events),
        upsertSiteContent(CONTENT_KEYS.pageGalleryHero, pageHeroes.gallery),
        upsertSiteContent(CONTENT_KEYS.pageBlogHero, pageHeroes.blog),
        upsertSiteContent(CONTENT_KEYS.homeTestimonials, { items: cleanedTestimonials }),
        upsertSiteContent(CONTENT_KEYS.settingsSocialLinks, socialLinks),
      ])
      setStatus('Saved successfully.')
    } catch (err) {
      setStatus(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl text-ink">Home & Page Content</h1>
        <button type="button" className={ADMIN_BTN} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save all'}</button>
      </div>
      {status ? <p className="text-sm text-ink-muted">{status}</p> : null}

      <section className={`${ADMIN_PANEL} space-y-4`}>
        <h2 className="font-display text-xl">Hero</h2>
        <TextField label="Label" value={hero.label} onChange={(v) => setHero({ ...hero, label: v })} />
        <TextField label="Headline line 1" value={hero.line1} onChange={(v) => setHero({ ...hero, line1: v })} />
        <TextField label="Headline line 2" value={hero.line2} onChange={(v) => setHero({ ...hero, line2: v })} />
        <TextField label="Accent word" value={hero.line2Accent} onChange={(v) => setHero({ ...hero, line2Accent: v })} />
        <TextArea label="Tagline" value={hero.tagline} onChange={(v) => setHero({ ...hero, tagline: v })} />
        <ImageField label="Background image" value={hero.backgroundImage} onChange={(v) => setHero({ ...hero, backgroundImage: v })} folder="cms" />
        <TextField label="Location label" value={hero.locationLabel} onChange={(v) => setHero({ ...hero, locationLabel: v })} />
      </section>

      <section className={`${ADMIN_PANEL} space-y-4`}>
        <h2 className="font-display text-xl">Mission</h2>
        <TextField label="Section label" value={mission.label} onChange={(v) => setMission({ ...mission, label: v })} />
        <TextArea label="Quote" value={mission.quote} onChange={(v) => setMission({ ...mission, quote: v })} />
        {mission.paragraphs.map((p, i) => (
          <TextArea key={i} label={`Paragraph ${i + 1}`} value={p} onChange={(v) => {
            const paragraphs = [...mission.paragraphs]
            paragraphs[i] = v
            setMission({ ...mission, paragraphs })
          }} />
        ))}
      </section>

      <section className={`${ADMIN_PANEL} space-y-4`}>
        <h2 className="font-display text-xl">Join CTA</h2>
        <TextField label="Label" value={join.label} onChange={(v) => setJoin({ ...join, label: v })} />
        <TextField label="Title" value={join.title} onChange={(v) => setJoin({ ...join, title: v })} />
        <TextArea label="Description" value={join.description} onChange={(v) => setJoin({ ...join, description: v })} />
      </section>

      <section className={`${ADMIN_PANEL} space-y-4`}>
        <h2 className="font-display text-xl">Social Media Links</h2>
        <p className="text-sm text-ink-muted">
          Add full profile URLs. Empty fields are hidden in the site footer.
        </p>
        {SOCIAL_PLATFORMS.map(({ key, label }) => (
          <TextField
            key={key}
            label={label}
            value={socialLinks[key]}
            onChange={(v) => setSocialLinks({ ...socialLinks, [key]: v })}
          />
        ))}
      </section>

      <section className={`${ADMIN_PANEL} space-y-4`}>
        <h2 className="font-display text-xl">Season & Page Heroes</h2>
        <TextField label="Season label" value={season.season} onChange={(v) => setSeason({ season: v })} />
        {(['events', 'gallery', 'blog']).map((key) => (
          <div key={key} className="rounded border border-border-light p-4 space-y-3">
            <h3 className="font-medium capitalize">{key} page hero</h3>
            <TextField label="Label" value={pageHeroes[key].label} onChange={(v) => setPageHeroes({ ...pageHeroes, [key]: { ...pageHeroes[key], label: v } })} />
            <TextField label="Title" value={pageHeroes[key].title} onChange={(v) => setPageHeroes({ ...pageHeroes, [key]: { ...pageHeroes[key], title: v } })} />
            <TextField label="Subtitle" value={pageHeroes[key].subtitle} onChange={(v) => setPageHeroes({ ...pageHeroes, [key]: { ...pageHeroes[key], subtitle: v } })} />
          </div>
        ))}
      </section>

      <section className={`${ADMIN_PANEL} space-y-4`}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-xl">Testimonials</h2>
          <button
            type="button"
            className={ADMIN_BTN}
            onClick={() => setTestimonials((prev) => [...prev, { quote: '', name: '', role: '' }])}
          >
            Add testimonial
          </button>
        </div>
        {testimonials.map((item, index) => (
          <div key={index} className="space-y-3 rounded border border-border-light p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-ink">Testimonial {index + 1}</p>
              {testimonials.length > 1 ? (
                <button
                  type="button"
                  className="text-sm text-burgundy"
                  onClick={() => setTestimonials((prev) => prev.filter((_, i) => i !== index))}
                >
                  Remove
                </button>
              ) : null}
            </div>
            <TextArea label="Quote" value={item.quote} onChange={(v) => {
              const next = [...testimonials]
              next[index] = { ...next[index], quote: v }
              setTestimonials(next)
            }} />
            <TextField label="Name" value={item.name} onChange={(v) => {
              const next = [...testimonials]
              next[index] = { ...next[index], name: v }
              setTestimonials(next)
            }} />
            <TextField label="Role" value={item.role} onChange={(v) => {
              const next = [...testimonials]
              next[index] = { ...next[index], role: v }
              setTestimonials(next)
            }} />
          </div>
        ))}
      </section>
    </div>
  )
}
