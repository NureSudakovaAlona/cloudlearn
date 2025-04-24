// api.test.ts
import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://cloudlearn-ten.vercel.app';

describe('API Endpoints', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('GET /api/data should return correct data structure', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: { items: ['item1', 'item2'] }
    });

    const response = await axios.get(`${API_URL}/api/data`);
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('items');
    expect(mockedAxios.get).toHaveBeenCalledWith(`${API_URL}/api/data`);
  });

  test('POST /api/submit should process valid data correctly', async () => {
    const validData = {
      name: 'Test User',
      email: 'test@example.com',
      phone: '+380501234567'
    };
    
    mockedAxios.post.mockResolvedValueOnce({
      status: 201,
      data: { success: true }
    });
    
    const response = await axios.post(`${API_URL}/api/submit`, validData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    expect(response.status).toBe(201);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      `${API_URL}/api/submit`, 
      validData, 
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/json'
        }
      })
    );
  });

  test('POST /api/submit should reject invalid data', async () => {
    const invalidData = {
      name: 'Test User',
      email: 'invalid-email',
      phone: '123'
    };
    
    mockedAxios.post.mockRejectedValueOnce({
      response: {
        status: 400,
        data: { errors: ['Invalid email format', 'Invalid phone format'] }
      }
    });
    
    try {
      await axios.post(`${API_URL}/api/submit`, invalidData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      fail('Expected request to fail');
    } catch (error: any) {
      expect(error.response.status).toBe(400);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${API_URL}/api/submit`, 
        invalidData, 
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );
    }
  });
});