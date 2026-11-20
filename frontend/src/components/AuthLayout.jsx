import { Link } from "react-router";

const AuthLayout = ({ children, storyTitle, storyDescription }) => (
  <div className="min-h-dvh bg-base-100 text-base-content" data-theme="forest">
    <div className="grid min-h-dvh lg:grid-cols-[minmax(28rem,0.92fr)_1.08fr]">
      <main className="flex min-h-dvh items-center justify-center px-6 py-10 sm:px-10 lg:px-12 xl:px-16">
        <div className="w-full max-w-md">
          <Link to="/login" className="inline-flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 shadow-sm">
              <img src="/lingualoom-mark.svg" alt="" className="size-8 object-contain" />
            </span>
            <span className="font-mono text-2xl font-bold text-primary">LinguaLoom</span>
          </Link>

          <div className="mt-11 sm:mt-14">
            <p className="mb-3 text-xs font-bold uppercase text-primary">
              Language grows through connection
            </p>
            {children}
          </div>

          <p className="mt-10 border-t border-base-content/10 pt-4 text-xs text-base-content/45">
            A more human way to become fluent.
          </p>
        </div>
      </main>

      <aside className="relative hidden min-h-dvh overflow-hidden border-l border-base-content/10 bg-gradient-to-br from-base-200 via-base-200 to-primary/10 px-10 py-12 lg:flex lg:items-center lg:justify-center xl:px-16">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="relative flex w-full max-w-xl flex-col items-center text-center">
          <img
            src="/signUp.png"
            alt="Two language partners talking through a video call"
            className="h-[min(40vh,22rem)] w-full object-contain"
          />
          <div className="mt-7 max-w-lg">
            <p className="mb-3 text-xs font-bold uppercase text-primary">
              Meet beyond your mother tongue
            </p>
            <h2 className="font-serif text-3xl font-semibold leading-tight xl:text-4xl">
              {storyTitle}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-base-content/65">
              {storyDescription}
            </p>
          </div>
          <div className="mt-7 flex items-center gap-2 text-xs font-medium text-base-content/60">
            <span className="rounded-full border border-base-content/10 bg-base-100/60 px-3 py-1">Hello</span>
            <span className="text-primary">⇄</span>
            <span className="rounded-full border border-base-content/10 bg-base-100/60 px-3 py-1">Bonjour</span>
            <span className="text-primary">⇄</span>
            <span className="rounded-full border border-base-content/10 bg-base-100/60 px-3 py-1">Hola</span>
          </div>
        </div>
      </aside>
    </div>
  </div>
);

export default AuthLayout;