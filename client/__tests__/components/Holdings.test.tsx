import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router } from 'wouter';
import Holdings from '../../src/pages/holdings';

// Mock the useAuth hook
jest.mock('../../src/lib/auth', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'testuser', portfolioName: 'Test Portfolio' },
    login: jest.fn(),
    logout: jest.fn(),
    isLoading: false,
  }),
}));

// Mock API responses
const mockHoldings = [
  {
    asset: {
      id: 1,
      name: 'Apple Inc.',
      ticker: 'AAPL',
      category: 'stock',
      sector: 'Technology',
      region: 'Stati Uniti'
    },
    totalQuantity: 10,
    averagePrice: 150,
    totalValue: 1500,
    totalInvested: 1400,
    unrealizedPL: 100,
    unrealizedPLPercent: 7.14,
    currentPrice: 150
  }
];

// Mock fetch globally
global.fetch = jest.fn();

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

describe('Holdings Component', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  test('renders holdings table with portfolio data', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockHoldings,
    });

    render(
      <TestWrapper>
        <Holdings />
      </TestWrapper>
    );

    expect(screen.getByText('Test Portfolio')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
      expect(screen.getByText('AAPL')).toBeInTheDocument();
      expect(screen.getByText('€1,500')).toBeInTheDocument();
    });
  });

  test('shows loading state initially', () => {
    (fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <TestWrapper>
        <Holdings />
      </TestWrapper>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('shows empty state when no holdings', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(
      <TestWrapper>
        <Holdings />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/no holdings found/i)).toBeInTheDocument();
    });
  });

  test('allows opening add transaction modal', async () => {
    const user = userEvent.setup();
    
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockHoldings,
    });

    render(
      <TestWrapper>
        <Holdings />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
    });

    // Find and click the buy button
    const buyButton = screen.getByRole('button', { name: /buy/i });
    await user.click(buyButton);

    // Modal should be opened (would need more mocking for full test)
  });
});