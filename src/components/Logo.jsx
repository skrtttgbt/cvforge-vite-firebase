import logoSrc from "../assets/images/logo.png";

export default function Logo({ dark = false }) {
  return (
    <div className={`flex items-center text-xl  tracking-tight ${dark ? 'bg-white' : 'bg-ink'} px-1 py-1 rounded-lg`}>
      <img
        src={logoSrc}
        alt=""
        className="h-auto w-10 rounded-lg object-contain justify-items-center "
        aria-hidden="true"
      />
      {/* <span className={dark ? 'text-white' : 'text-ink'}>CVForge</span> */}
    </div>
  )
}
