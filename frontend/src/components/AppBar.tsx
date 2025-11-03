import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import type { User } from "../types";

const DRAWER_WIDTH = 240;

interface NavigationItem {
  label: string;
  path: string;
  adminOnly?: boolean;
}

const navigationItems: NavigationItem[] = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "My Ballot", path: "/ballot" },
  { label: "Results", path: "/results" },
  { label: "Admin", path: "/admin", adminOnly: true },
];

interface AppBarProps {
  user: User | null;
  logout: () => void;
}

function ResponsiveAppBar({ user, logout }: AppBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleDrawerClose = () => {
    setMobileOpen(false);
  };

  const isActivePath = (path: string) => location.pathname === path;

  const filteredNavItems = navigationItems.filter(
    (item) => !item.adminOnly || user?.role === "admin"
  );

  // Don't show app bar on login page
  if (!user || location.pathname === "/login") {
    return null;
  }

  const drawer = (
    <Box onClick={handleDrawerClose} sx={{ textAlign: "center" }}>
      <Typography variant="h6" sx={{ my: 2, fontWeight: "bold" }}>
        Hall of Fame
      </Typography>
      <Divider />
      <List>
        {filteredNavItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={isActivePath(item.path)}
              sx={{
                textAlign: "center",
                "&.Mui-selected": {
                  backgroundColor: "primary.light",
                  color: "primary.contrastText",
                  "&:hover": {
                    backgroundColor: "primary.main",
                  },
                },
              }}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider sx={{ my: 2 }} />
      <Box sx={{ px: 2, pb: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Signed in as
        </Typography>
        <Chip
          label={user.username}
          size="small"
          color={user.role === "admin" ? "secondary" : "default"}
          icon={user.role === "admin" ? <AdminPanelSettingsIcon /> : undefined}
          sx={{ mb: 2 }}
        />
        <Button
          variant="outlined"
          fullWidth
          startIcon={<LogoutIcon />}
          onClick={logout}
          size="small"
        >
          Logout
        </Button>
      </Box>
    </Box>
  );

  return (
    <>
      <AppBar position="static" elevation={2}>
        <Toolbar>
          {/* Mobile menu button */}
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          {/* Title */}
          <Typography
            variant="h6"
            component={Link}
            to="/dashboard"
            sx={{
              flexGrow: { xs: 1, sm: 0 },
              mr: 4,
              fontWeight: "bold",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            Hall of Fame
          </Typography>

          {/* Desktop navigation */}
          <Box sx={{ flexGrow: 1, display: { xs: "none", sm: "flex" }, gap: 1 }}>
            {filteredNavItems.map((item) => (
              <Button
                key={item.path}
                component={Link}
                to={item.path}
                sx={{
                  color: "white",
                  backgroundColor: isActivePath(item.path)
                    ? "rgba(255, 255, 255, 0.2)"
                    : "transparent",
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                  },
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          {/* Desktop user info and logout */}
          <Box sx={{ display: { xs: "none", sm: "flex" }, gap: 2, alignItems: "center" }}>
            <Chip
              label={`${user.username} (${user.role})`}
              size="small"
              sx={{
                color: "white",
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                "& .MuiChip-icon": { color: "white" },
              }}
              icon={user.role === "admin" ? <AdminPanelSettingsIcon /> : undefined}
            />
            <Button
              color="inherit"
              startIcon={<LogoutIcon />}
              onClick={logout}
              sx={{
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                },
              }}
            >
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: "block", sm: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: DRAWER_WIDTH,
          },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
}

export default ResponsiveAppBar;
