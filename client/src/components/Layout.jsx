import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./Layout.css";

const links = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/sites", label: "Sites" },
  { to: "/inspections", label: "Inspections" },
];

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <nav className="nav-rail">
        <div className="nav-rail__brand">Safety Compliance</div>
        <div className="nav-rail__links">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                isActive ? "nav-rail__link active" : "nav-rail__link"
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
        <div className="nav-rail__footer">
          <div className="nav-rail__user">{user?.name}</div>
          <div className="nav-rail__role">{user?.role}</div>
          <button className="nav-rail__logout" onClick={logout}>
            Sign out
          </button>
        </div>
      </nav>
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}
