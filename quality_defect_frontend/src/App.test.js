import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./auth/AuthContext";

test("renders login screen when unauthenticated", () => {
  render(
    <MemoryRouter initialEntries={["/login"]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>
  );

  // Unambiguous: the page title ("Sign in") is a heading, while the submit control is a button.
  expect(screen.getByRole("heading", { level: 1, name: /sign in/i })).toBeInTheDocument();
});
