import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router } from 'wouter';
import Login from '../../src/pages/login';

// Mock the useAuth hook
jest.mock('../../src/lib/auth', () => ({
  useAuth: () => ({
    user: null,
    login: jest.fn(),
    logout: jest.fn(),
    isLoading: false,
  }),
}));

// Mock the toast hook
jest.mock('../../src/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        {children}
      </Router>
    </QueryClientProvider>
  );
};

describe('Login Component', () => {
  test('renders login form correctly', () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByText('Sign in to your portfolio')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('switches to register form when clicking register tab', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    const registerTab = screen.getByText('Register');
    await user.click(registerTab);

    expect(screen.getByText('Create Account')).toBeInTheDocument();
    expect(screen.getByText('Start tracking your portfolio')).toBeInTheDocument();
    expect(screen.getByLabelText('Portfolio Name')).toBeInTheDocument();
  });

  test('validates required fields on login form submission', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    const signInButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(signInButton);

    // Form validation should prevent submission with empty fields
    expect(screen.getByLabelText('Username')).toBeInvalid();
    expect(screen.getByLabelText('Password')).toBeInvalid();
  });

  test('validates password length on register form', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    // Switch to register tab
    await user.click(screen.getByText('Register'));

    // Fill in form with short password
    await user.type(screen.getByLabelText('Username'), 'testuser');
    await user.type(screen.getByLabelText('Portfolio Name'), 'Test Portfolio');
    await user.type(screen.getByLabelText('Password'), '123'); // Too short

    const createAccountButton = screen.getByRole('button', { name: /create account/i });
    await user.click(createAccountButton);

    // Should show password validation error
    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    });
  });
});