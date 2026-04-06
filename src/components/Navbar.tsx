import { ChevronDown } from "lucide-react"
import { Button } from "./ui/button"

export function Navbar() {
  return (
    <>
      <nav className="w-full py-5 px-8 flex flex-row justify-between items-center relative z-10">
        <div className="flex-shrink-0">
          <img src="/src/assets/logo.png" alt="Logo" className="h-[32px] w-auto" />
        </div>
        <div className="flex flex-row items-center gap-1 justify-center">
          <Button variant="ghost" className="text-foreground/90 text-base font-normal">
            Features <ChevronDown className="ml-1 h-4 w-4" />
          </Button>
          <Button variant="ghost" className="text-foreground/90 text-base font-normal">
            Solutions
          </Button>
          <Button variant="ghost" className="text-foreground/90 text-base font-normal">
            Plans
          </Button>
          <Button variant="ghost" className="text-foreground/90 text-base font-normal">
            Learning <ChevronDown className="ml-1 h-4 w-4" />
          </Button>
        </div>
        <div>
          <Button variant="heroSecondary" size="sm" className="rounded-full px-4 py-2 text-sm font-medium">
            Sign Up
          </Button>
        </div>
      </nav>
      <div className="relative z-10 mt-[3px] w-full h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />
    </>
  )
}
