import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[hsl(222,47%,11%)]/95 backdrop-blur-lg border-b border-[hsl(217,91%,60%)]/20">
      <div className="container flex items-center justify-between h-16">
        <div className="cursor-pointer" onClick={() => navigate("/")}>
          <Logo size="lg" showName />
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-semibold bg-gradient-to-r from-[hsl(174,62%,50%)] to-[hsl(190,80%,70%)] bg-clip-text text-transparent hover:drop-shadow-[0_0_12px_hsl(174,62%,50%,0.6)] transition-all duration-300">Features</a>
          <a href="#industries" className="text-sm font-semibold bg-gradient-to-r from-[hsl(270,80%,70%)] to-[hsl(300,80%,75%)] bg-clip-text text-transparent hover:drop-shadow-[0_0_12px_hsl(270,80%,70%,0.6)] transition-all duration-300">Industries</a>
          <a href="#pricing" className="text-sm font-semibold bg-gradient-to-r from-[hsl(38,92%,60%)] to-[hsl(25,95%,65%)] bg-clip-text text-transparent hover:drop-shadow-[0_0_12px_hsl(38,92%,60%,0.6)] transition-all duration-300">Pricing</a>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Button variant="ghost" size="sm" className="text-[hsl(213,97%,87%)] hover:text-white hover:drop-shadow-[0_0_10px_hsl(213,97%,87%,0.6)] transition-all duration-300" onClick={() => navigate("/dashboard")}>Dashboard</Button>
              <Button variant="outline" size="sm" className="border-[hsl(213,97%,87%)]/40 text-[hsl(213,97%,87%)] hover:text-white hover:bg-[hsl(217,91%,60%)]/10 hover:shadow-[0_0_15px_hsl(213,97%,87%,0.4)] transition-all duration-300" onClick={() => { signOut(); navigate("/"); }}>Log Out</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="font-semibold bg-gradient-to-r from-[hsl(213,97%,75%)] to-[hsl(230,90%,80%)] bg-clip-text text-transparent hover:drop-shadow-[0_0_12px_hsl(213,97%,75%,0.6)] transition-all duration-300" onClick={() => navigate("/login")}>Log In</Button>
              <Button size="sm" className="bg-gradient-primary border border-primary/40 shadow-[0_0_15px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_25px_hsl(var(--primary)/0.6),0_0_50px_hsl(var(--primary)/0.3)] hover:border-primary/80 transition-all duration-300" onClick={() => navigate("/signup")}>Start Free Trial</Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
