const fc = require('fast-check');
const User = require('../models/User');
const Address = require('../models/Address');
const { getProfile } = require('../controllers/userController');

// Mock the models
jest.mock('../models/User');
jest.mock('../models/Address');

describe('User Controller - Property-Based Tests', () => {
  describe('Property 5: User Profile Data Availability', () => {
    /**
     * Feature: itkmmshop-ecommerce, Property 5: User Profile Data Availability
     * Validates: Requirements 2.3
     * 
     * For any authenticated user accessing their profile, the system should display 
     * complete information including order history, shipping addresses, and account settings
     */
    test('should display complete profile information for any authenticated user', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.integer({ min: 1, max: 10000 }),
            email: fc.emailAddress(),
            first_name: fc.string({ minLength: 1, maxLength: 50 }),
            last_name: fc.string({ minLength: 1, maxLength: 50 }),
            gender: fc.constantFrom('male', 'female', 'other', null),
            birth_date: fc.option(fc.date({ min: new Date('1950-01-01'), max: new Date('2010-12-31') }), { nil: null }),
            phone: fc.option(fc.integer({ min: 1000000000, max: 9999999999 }).map(n => n.toString()), { nil: null }),
            role: fc.constantFrom('customer', 'staff', 'admin')
          }),
          fc.array(
            fc.record({
              id: fc.integer({ min: 1, max: 1000 }),
              recipient_name: fc.string({ minLength: 1, maxLength: 50 }),
              phone: fc.integer({ min: 1000000000, max: 9999999999 }).map(n => n.toString()),
              address_line1: fc.string({ minLength: 5, maxLength: 100 }),
              subdistrict: fc.string({ minLength: 2, maxLength: 50 }),
              district: fc.string({ minLength: 2, maxLength: 50 }),
              province: fc.string({ minLength: 2, maxLength: 50 }),
              postal_code: fc.integer({ min: 10000, max: 99999 }).map(n => n.toString()),
              is_default: fc.boolean()
            }),
            { maxLength: 5 }
          ),
          async (userData, addresses) => {
            // Mock User.getProfile to return user data
            User.getProfile.mockResolvedValue(userData);
            
            // Mock Address.findByUserId to return addresses
            Address.findByUserId.mockResolvedValue(addresses);

            // Mock request with authenticated user
            const req = {
              user: { id: userData.id }
            };
            const res = {
              json: jest.fn()
            };

            // Call getProfile
            await getProfile(req, res);

            // Verify response contains all required profile data
            expect(res.json).toHaveBeenCalledWith(
              expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                  id: userData.id,
                  email: userData.email,
                  first_name: userData.first_name,
                  last_name: userData.last_name,
                  role: userData.role,
                  addresses: expect.any(Array)
                })
              })
            );

            // Verify addresses are included
            const responseData = res.json.mock.calls[0][0].data;
            expect(responseData.addresses).toHaveLength(addresses.length);
            
            // Verify each address contains required fields
            if (addresses.length > 0) {
              addresses.forEach((addr, index) => {
                expect(responseData.addresses[index]).toMatchObject({
                  id: addr.id,
                  recipient_name: addr.recipient_name,
                  phone: addr.phone,
                  address_line1: addr.address_line1,
                  subdistrict: addr.subdistrict,
                  district: addr.district,
                  province: addr.province,
                  postal_code: addr.postal_code
                });
              });
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should include optional profile fields when available', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.integer({ min: 1, max: 10000 }),
            email: fc.emailAddress(),
            first_name: fc.string({ minLength: 1, maxLength: 50 }),
            last_name: fc.string({ minLength: 1, maxLength: 50 }),
            gender: fc.constantFrom('male', 'female', 'other'),
            birth_date: fc.date({ min: new Date('1950-01-01'), max: new Date('2010-12-31') }),
            phone: fc.integer({ min: 1000000000, max: 9999999999 }).map(n => n.toString()),
            role: fc.constantFrom('customer', 'staff', 'admin')
          }),
          async (userData) => {
            User.getProfile.mockResolvedValue(userData);
            Address.findByUserId.mockResolvedValue([]);

            const req = { user: { id: userData.id } };
            const res = { json: jest.fn() };

            await getProfile(req, res);

            const responseData = res.json.mock.calls[0][0].data;
            
            // Verify optional fields are present when provided
            expect(responseData.gender).toBe(userData.gender);
            expect(responseData.birth_date).toEqual(userData.birth_date);
            expect(responseData.phone).toBe(userData.phone);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

describe('User Controller - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return 404 when user not found', async () => {
    User.getProfile.mockResolvedValue(null);

    const req = { user: { id: 999 } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await getProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'USER_NOT_FOUND'
        })
      })
    );
  });

  test('should return empty addresses array when user has no addresses', async () => {
    const userData = {
      id: 1,
      email: 'test@example.com',
      first_name: 'John',
      last_name: 'Doe',
      role: 'customer'
    };

    User.getProfile.mockResolvedValue(userData);
    Address.findByUserId.mockResolvedValue([]);

    const req = { user: { id: 1 } };
    const res = { json: jest.fn() };

    await getProfile(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          addresses: []
        })
      })
    );
  });
});
