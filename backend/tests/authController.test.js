const fc = require('fast-check');
const User = require('../models/User');
const { register } = require('../controllers/authController');

// Mock the User model
jest.mock('../models/User');

describe('Authentication Controller - Property-Based Tests', () => {
  describe('Property 4: User Registration Data Completeness', () => {
    /**
     * Feature: itkmmshop-ecommerce, Property 4: User Registration Data Completeness
     * Validates: Requirements 2.1
     * 
     * For any user registration attempt, the system should collect and store 
     * all specified fields (name, surname, gender, birth date, phone, email, password, address)
     */
    
    // Custom email generator that produces Joi-compatible emails
    const joiCompatibleEmail = () => {
      return fc.tuple(
        fc.array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), { minLength: 1, maxLength: 10 }).map(arr => arr.join('')),
        fc.array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), { minLength: 1, maxLength: 10 }).map(arr => arr.join('')),
        fc.constantFrom('com', 'net', 'org', 'edu', 'gov')
      ).map(([local, domain, tld]) => `${local}@${domain}.${tld}`);
    };
    
    test('should collect and store all required registration fields for any valid user data', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: joiCompatibleEmail(),
            password: fc.string({ minLength: 6, maxLength: 20 }).filter(s => /^[a-zA-Z0-9]+$/.test(s) && s.length >= 6),
            first_name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z]+$/.test(s) && s.length > 0),
            last_name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z]+$/.test(s) && s.length > 0),
            gender: fc.constantFrom('male', 'female', 'other'),
            birth_date: fc.date({ min: new Date('1950-01-01'), max: new Date('2010-12-31') }),
            phone: fc.integer({ min: 1000000000, max: 9999999999 }).map(n => n.toString())
          }),
          async (generatedData) => {
            // Convert Date to ISO string format for Joi validation
            const userData = {
              ...generatedData,
              birth_date: generatedData.birth_date.toISOString().split('T')[0] // Format as YYYY-MM-DD
            };
            
            // Clear mocks before each property test iteration
            jest.clearAllMocks();
            
            // Mock User.findByEmail to return null (user doesn't exist)
            User.findByEmail.mockResolvedValue(null);
            
            // Mock User.create to return a user ID
            const mockUserId = Math.floor(Math.random() * 1000) + 1;
            User.create.mockResolvedValue(mockUserId);
            
            // Mock User.getProfile to return the created user
            const mockUser = {
              id: mockUserId,
              email: userData.email,
              first_name: userData.first_name,
              last_name: userData.last_name,
              gender: userData.gender,
              birth_date: userData.birth_date,
              phone: userData.phone,
              role: 'customer'
            };
            User.getProfile.mockResolvedValue(mockUser);

            // Mock request and response
            const req = { body: userData };
            const res = {
              status: jest.fn().mockReturnThis(),
              json: jest.fn()
            };

            // Call register
            await register(req, res);

            // First verify that validation passed (no 400 error)
            if (res.status.mock.calls.length > 0 && res.status.mock.calls[0][0] === 400) {
              // If validation failed, log the error for debugging
              const errorResponse = res.json.mock.calls[0][0];
              throw new Error(`Validation failed for email ${userData.email}: ${JSON.stringify(errorResponse)}`);
            }

            // Verify User.create was called exactly once with all required fields
            expect(User.create).toHaveBeenCalledTimes(1);
            expect(User.create).toHaveBeenCalledWith(
              expect.objectContaining({
                email: userData.email,
                password: userData.password,
                first_name: userData.first_name,
                last_name: userData.last_name,
                gender: userData.gender,
                birth_date: expect.anything(), // Joi converts to Date object
                phone: userData.phone
              })
            );

            // Verify response contains all user data
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
              expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                  user: expect.objectContaining({
                    email: userData.email,
                    first_name: userData.first_name,
                    last_name: userData.last_name,
                    gender: userData.gender,
                    phone: userData.phone
                  }),
                  token: expect.any(String)
                })
              })
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should store user with customer role by default for any registration', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: joiCompatibleEmail(),
            password: fc.string({ minLength: 6, maxLength: 20 }).filter(s => /^[a-zA-Z0-9]+$/.test(s) && s.length >= 6),
            first_name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z]+$/.test(s) && s.length > 0),
            last_name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z]+$/.test(s) && s.length > 0)
          }),
          async (userData) => {
            // Clear mocks before each property test iteration
            jest.clearAllMocks();
            
            User.findByEmail.mockResolvedValue(null);
            const mockUserId = Math.floor(Math.random() * 1000) + 1;
            User.create.mockResolvedValue(mockUserId);
            
            const mockUser = {
              id: mockUserId,
              ...userData,
              role: 'customer'
            };
            User.getProfile.mockResolvedValue(mockUser);

            const req = { body: userData };
            const res = {
              status: jest.fn().mockReturnThis(),
              json: jest.fn()
            };

            await register(req, res);

            // First verify that validation passed (no 400 error)
            if (res.status.mock.calls.length > 0 && res.status.mock.calls[0][0] === 400) {
              const errorResponse = res.json.mock.calls[0][0];
              throw new Error(`Validation failed for email ${userData.email}: ${JSON.stringify(errorResponse)}`);
            }

            // Verify User.create was called exactly once
            expect(User.create).toHaveBeenCalledTimes(1);
            
            // Verify the created user has customer role
            const createCall = User.create.mock.calls[0][0];
            expect(createCall.role === undefined || createCall.role === 'customer').toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

describe('Authentication Controller - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should reject registration with existing email', async () => {
    const userData = {
      email: 'existing@example.com',
      password: 'password123',
      first_name: 'John',
      last_name: 'Doe'
    };

    User.findByEmail.mockResolvedValue({ id: 1, email: userData.email });

    const req = { body: userData };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'USER_EXISTS'
        })
      })
    );
  });

  test('should reject registration with invalid email format', async () => {
    const userData = {
      email: 'invalid-email',
      password: 'password123',
      first_name: 'John',
      last_name: 'Doe'
    };

    const req = { body: userData };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR'
        })
      })
    );
  });

  test('should reject registration with short password', async () => {
    const userData = {
      email: 'test@example.com',
      password: '12345',
      first_name: 'John',
      last_name: 'Doe'
    };

    const req = { body: userData };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR'
        })
      })
    );
  });
});
