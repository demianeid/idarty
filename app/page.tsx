import Link from 'next/link'
import { ArrowRight, CalendarCheck2, Check, ChevronRight, Clock3, Menu, ShieldCheck, Sparkles, UsersRound } from 'lucide-react'

const navigation = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
  { label: 'For businesses', href: '#businesses' },
  { label: 'Pricing', href: '#pricing' },
]

const features = [
  { icon: CalendarCheck2, title: 'Bookings that fit your business', description: 'Let customers book the right service, with the right team member, at a time that works.' },
  { icon: Clock3, title: 'Less back-and-forth', description: 'Automated availability and reminders keep every appointment moving without extra admin.' },
  { icon: UsersRound, title: 'One calm workspace', description: 'Give your team a simple place to manage schedules, customers, and daily requests.' },
]

const arabicFeatures = [
  { icon: CalendarCheck2, title: 'حجوزات تناسب نشاطك', description: 'دع العملاء يحجزون الخدمة المناسبة مع الموظف المناسب في الوقت المناسب.' },
  { icon: Clock3, title: 'تواصل أقل', description: 'تساعدك أوقات التوفر والتذكيرات التلقائية على تنظيم كل موعد بسهولة.' },
  { icon: UsersRound, title: 'مساحة عمل هادئة', description: 'امنح فريقك مكاناً بسيطاً لإدارة الجداول والعملاء والطلبات اليومية.' },
]

export default function Page({ locale = 'en' }: { locale?: 'ar' | 'en' }) {
  const authPath = (path: 'login' | 'signup') => locale === 'en' ? `/${path}` : `/${locale}/${path}`
  const rtl = locale === 'ar'
  const copy = rtl ? {
    how: 'كيف يعمل', features: 'المزايا', businesses: 'للشركات', pricing: 'الأسعار', login: 'تسجيل الدخول', getStarted: 'ابدأ الآن', eyebrow: 'طريقة أفضل لإدارة يومك', title: 'اجعل كل حجز أكثر سهولة.', description: 'يمنح idarty الشركات الخدمية مكاناً واحداً لإدارة المواعيد والفرق والعملاء، لتمنح وقتك لما يهم فعلاً.', start: 'ابدأ مجاناً', seeHow: 'اكتشف كيف يعمل', noCard: 'لا تحتاج إلى بطاقة ائتمانية', teams: 'مصمم للفرق النامية', everything: 'كل شيء في مكان واحد', clearer: 'يبدأ اليوم الواضح من هنا.', intro: 'من أول حجز إلى آخر تذكير، يساعدك idarty على تنظيم نشاطك والعناية بعملائك.', businessEyebrow: 'مصمم للشركات الحقيقية', businessTitle: 'رعاية أكبر للعملاء. عمل أقل خلف الكواليس.', businessDescription: 'سواء كنت تدير عيادة أو استوديو أو مكتباً استشارياً أو خدمة محلية، يتكيف idarty مع طريقة عمل فريقك.', createWorkspace: 'أنشئ مساحة عملك', ready: 'مستعد عندما تكون', readyTitle: 'امنح نشاطك طريقة أكثر هدوءاً للنمو.', secure: 'مصمم بأمان', featuresFooter: 'المزايا', businessesFooter: 'الشركات', secureAria: 'آمن بتصميمه'
  } : {
    how: 'How it works', features: 'Features', businesses: 'For businesses', pricing: 'Pricing', login: 'Log in', getStarted: 'Get started', eyebrow: 'A better way to run your day', title: 'Make every booking feel effortless.', description: 'idarty gives service businesses one simple place to manage appointments, teams, and customers—so you can spend more time doing meaningful work.', start: 'Start for free', seeHow: 'See how it works', noCard: 'No credit card required', teams: 'Built for growing teams', everything: 'Everything in one place', clearer: 'A clearer day starts here.'
  }

  return (
    <main dir={rtl ? 'rtl' : 'ltr'} className="min-h-screen overflow-hidden bg-[#fbfcff] text-[#172033]">
      <header className="relative z-10 border-b border-[#e9edf5] bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="idarty home">
            <span className="flex size-10 items-center justify-center rounded-[13px] bg-[#315efb] text-sm font-bold text-white shadow-[0_8px_20px_rgba(49,94,251,.2)]">id</span>
            <span className="text-xl font-semibold tracking-[-.04em]">idarty</span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
            {[{ label: copy.how, href: '#how-it-works' }, { label: copy.features, href: '#features' }, { label: copy.businesses, href: '#businesses' }, { label: copy.pricing, href: '#pricing' }].map((item) => <a key={item.href} href={item.href} className="text-sm font-medium text-[#69758c] transition hover:text-[#315efb]">{item.label}</a>)}
          </nav>
          <div className="flex items-center gap-3">
            <Link href={authPath('login')} className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-[#516078] transition hover:bg-[#f3f6ff] md:block">{copy.login}</Link>
            <Link href={authPath('signup')} className="rounded-xl bg-[#315efb] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(49,94,251,.18)] transition hover:bg-[#244bd4]">{copy.getStarted}</Link>
            <button className="rounded-xl p-2 text-[#516078] md:hidden" aria-label="Open navigation"><Menu /></button>
          </div>
        </div>
      </header>

      <section className="relative mx-auto max-w-7xl px-6 pb-20 pt-16 lg:px-8 lg:pb-28 lg:pt-24">
        <div className="pointer-events-none absolute -right-40 -top-20 size-[520px] rounded-full bg-[#e5ebff] opacity-60 blur-3xl" />
        <div className="relative grid items-center gap-14 lg:grid-cols-[1.02fr_.98fr] lg:gap-20">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#dce4ff] bg-[#f2f5ff] px-3.5 py-2 text-xs font-semibold text-[#315efb]"><Sparkles className="size-3.5" /> {copy.eyebrow}</div>
            <h1 className="max-w-2xl text-5xl font-semibold leading-[1.05] tracking-[-.055em] text-[#15203a] sm:text-6xl lg:text-[72px]">{rtl ? copy.title : <>Make every booking feel <span className="text-[#315efb]">effortless.</span></>}</h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-[#68758d]">{copy.description}</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row"><Link href={authPath('signup')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#315efb] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(49,94,251,.2)] transition hover:bg-[#244bd4]">{copy.start} <ArrowRight className="size-4" /></Link><a href="#how-it-works" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#dfe5f0] bg-white px-5 py-3.5 text-sm font-semibold text-[#46536b] transition hover:border-[#b9c8f6]">{copy.seeHow} <ChevronRight className="size-4" /></a></div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-[#78859b]"><span className="flex items-center gap-2"><Check className="size-4 text-[#36a875]" /> {copy.noCard}</span><span className="flex items-center gap-2"><Check className="size-4 text-[#36a875]" /> {copy.teams}</span></div>
          </div>
          <div className="relative mx-auto w-full max-w-[510px]">
            <div className="absolute -left-5 top-14 hidden rounded-2xl border border-[#e3e9f6] bg-white p-4 shadow-[0_18px_50px_rgba(46,67,112,.12)] sm:block"><div className="flex items-center gap-2 text-xs font-semibold text-[#52617a]"><span className="flex size-8 items-center justify-center rounded-lg bg-[#e8f8f1] text-[#29a06a]"><CalendarCheck2 className="size-4" /></span> {rtl ? 'تم تأكيد الحجز' : 'Booking confirmed'}</div><p className="mt-2 text-xs text-[#8a96a9]">{rtl ? 'اليوم الساعة ١٠:٣٠ صباحاً' : 'Today at 10:30 AM'}</p></div>
            <div className="rounded-[28px] border border-[#e2e8f4] bg-white p-3 shadow-[0_24px_80px_rgba(55,78,130,.14)]"><div className="rounded-[21px] bg-[#f5f7fc] p-5 sm:p-7"><div className="flex items-center justify-between"><div><p className="text-xs font-medium text-[#8995a9]">{rtl ? 'الثلاثاء، ٤ أكتوبر' : 'Tuesday, October 4'}</p><h2 className="mt-1 text-xl font-semibold tracking-tight text-[#1d2940]">{rtl ? 'جدول اليوم' : 'Today&apos;s schedule'}</h2></div><span className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[#315efb] shadow-sm">{rtl ? 'عرض التقويم' : 'View calendar'}</span></div><div className="mt-6 flex flex-col gap-3"><ScheduleItem time="09:00" title={rtl ? 'استشارة' : 'Consultation'} name={rtl ? 'عيادة القاهرة للأسنان' : 'Cairo Dental Clinic'} color="blue" /><ScheduleItem time="10:30" title={rtl ? 'موعد متابعة' : 'Follow-up appointment'} name={rtl ? 'مركز النيل للعافية' : 'Nile Wellness Center'} color="violet" /><ScheduleItem time="12:00" title={rtl ? 'توافر الفريق' : 'Team availability'} name={rtl ? '٣ أعضاء متصلون' : '3 members online'} color="green" /></div><div className="mt-5 rounded-xl border border-dashed border-[#cbd5ee] bg-white/70 p-3 text-center text-xs font-medium text-[#7d89a0]">{rtl ? 'أقرب موعد متاح بعد ٣٠ دقيقة' : 'Your next available slot is in 30 minutes'}</div></div></div>
            <div className="absolute -bottom-5 -right-3 hidden rounded-2xl border border-[#e3e9f6] bg-white p-4 shadow-[0_18px_50px_rgba(46,67,112,.12)] sm:block"><p className="text-[11px] font-semibold uppercase tracking-wider text-[#9aa4b5]">{rtl ? 'هذا الشهر' : 'This month'}</p><p className="mt-1 text-2xl font-semibold text-[#17233b]">+28%</p><p className="text-xs text-[#36a875]">{rtl ? 'حجوزات أكثر' : 'more bookings'}</p></div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-[#e9edf5] bg-white px-6 py-16 lg:px-8 lg:py-20"><div className="mx-auto max-w-7xl"><div className="max-w-2xl"><p className="text-sm font-semibold text-[#315efb]">{copy.everything}</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.04em] text-[#17233b] sm:text-4xl">{copy.clearer}</h2><p className="mt-4 text-base leading-7 text-[#758197]">{copy.intro}</p></div><div id="features" className="mt-12 grid gap-5 md:grid-cols-3">{(rtl ? arabicFeatures : features).map((feature) => <div key={feature.title} className="rounded-2xl border border-[#e6ebf4] bg-[#fbfcff] p-6"><span className="flex size-11 items-center justify-center rounded-xl bg-[#eef2ff] text-[#315efb]"><feature.icon className="size-5" /></span><h3 className="mt-5 text-lg font-semibold tracking-tight">{feature.title}</h3><p className="mt-2 text-sm leading-6 text-[#78859b]">{feature.description}</p></div>)}</div></div></section>

      <section id="businesses" className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:px-8 lg:py-28"><div><p className="text-sm font-semibold text-[#315efb]">{copy.businessEyebrow}</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">{copy.businessTitle}</h2><p className="mt-5 leading-7 text-[#758197]">{copy.businessDescription}</p><Link href={authPath('signup')} className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[#315efb]">{copy.createWorkspace} <ArrowRight className="size-4" /></Link></div><div className="grid gap-4 sm:grid-cols-2"><QuoteCard quote={rtl ? 'توقفنا عن متابعة التأكيدات وبدأنا نركز على عملائنا.' : 'We stopped chasing confirmations and started focusing on our clients.'} name={rtl ? 'مريم حسن' : 'Mariam Hassan'} role={rtl ? 'مالكة، مركز النيل للعافية' : 'Owner, Nile Wellness Center'} /><QuoteCard quote={rtl ? 'يعرف الفريق كله ما سيحدث تالياً. هذا يغير كل شيء.' : 'The whole team knows what is happening next. That changes everything.'} name={rtl ? 'أليكس مورغان' : 'Alex Morgan'} role={rtl ? 'العمليات، عيادة القاهرة للأسنان' : 'Operations, Cairo Dental Clinic'} /></div></section>

      <section id="pricing" className="mx-6 mb-16 rounded-[28px] bg-[#17233b] px-6 py-14 text-white sm:px-12 lg:mx-auto lg:max-w-7xl lg:px-16"><div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center"><div><p className="text-sm font-semibold text-[#aebdff]">{copy.ready}</p><h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-[-.04em] sm:text-4xl">{copy.readyTitle}</h2></div><Link href={authPath('signup')} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-[#315efb] transition hover:bg-[#eef2ff]">{rtl ? 'ابدأ مجاناً' : 'Get started free'} <ArrowRight className="size-4" /></Link></div></section>

      <footer className="border-t border-[#e9edf5] bg-white"><div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-8 text-sm text-[#7c8799] sm:flex-row sm:items-center sm:justify-between lg:px-8"><div className="flex items-center gap-2 font-semibold text-[#24304a]"><span className="flex size-7 items-center justify-center rounded-lg bg-[#315efb] text-[10px] text-white">id</span> idarty</div><div className="flex flex-wrap gap-5"><a href="#features" className="hover:text-[#315efb]">{copy.featuresFooter}</a><a href="#businesses" className="hover:text-[#315efb]">{copy.businessesFooter}</a><Link href={authPath('login')} className="hover:text-[#315efb]">{copy.login}</Link><Link href={authPath('signup')} className="hover:text-[#315efb]">{copy.getStarted}</Link></div><div className="flex items-center gap-2"><ShieldCheck className="size-4" /> {copy.secureAria}</div></div></footer>
    </main>
  )
}

function ScheduleItem({ time, title, name, color }: { time: string; title: string; name: string; color: 'blue' | 'violet' | 'green' }) { const colors = { blue: 'bg-[#dfe8ff]', violet: 'bg-[#eee6ff]', green: 'bg-[#ddf5e9]' }; return <div className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm"><span className="w-12 text-xs font-semibold text-[#8692a6]">{time}</span><span className={`flex size-9 items-center justify-center rounded-lg ${colors[color]}`}><CalendarCheck2 className="size-4 text-[#526cf2]" /></span><div className="min-w-0"><p className="truncate text-xs font-semibold text-[#354159]">{title}</p><p className="mt-0.5 truncate text-[11px] text-[#929caf]">{name}</p></div></div> }
function QuoteCard({ quote, name, role }: { quote: string; name: string; role: string }) { return <div className="rounded-2xl border border-[#e5eaf3] bg-white p-6 shadow-[0_12px_35px_rgba(47,68,115,.05)]"><p className="text-base leading-7 text-[#526078]">“{quote}”</p><div className="mt-6 border-t border-[#edf0f5] pt-4"><p className="text-sm font-semibold text-[#26334b]">{name}</p><p className="mt-1 text-xs text-[#8a95a8]">{role}</p></div></div> }
