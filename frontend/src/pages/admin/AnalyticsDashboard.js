import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../components/admin/AdminStyles.css';
import '../../components/admin/AnalyticsStyles.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const AnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [locationLevel, setLocationLevel] = useState('province');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [locationData, setLocationData] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    fetchLocationData();
  }, [locationLevel, selectedProvince, selectedDistrict]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/analytics/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const fetchLocationData = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = {};
      
      if (locationLevel === 'district' && selectedProvince) {
        params.province = selectedProvince;
      } else if (locationLevel === 'subdistrict' && selectedProvince && selectedDistrict) {
        params.province = selectedProvince;
        params.district = selectedDistrict;
      }

      const response = await axios.get(`${API_URL}/analytics/location`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (response.data.success) {
        setLocationData(response.data.data.data);
      }
    } catch (err) {
      console.error('Error fetching location data:', err);
    }
  };

  if (loading) {
    return <div className="loading">กำลังโหลดข้อมูล...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!dashboardData) {
    return <div className="error-message">ไม่พบข้อมูล</div>;
  }

  return (
    <div className="analytics-dashboard">
      <h1>วิเคราะห์ข้อมูลลูกค้า</h1>

      {/* Summary Cards */}
      <div className="analytics-summary">
        <div className="summary-card">
          <h3>ลูกค้าทั้งหมด</h3>
          <p className="summary-value">{dashboardData.summary.totalCustomers.toLocaleString()}</p>
        </div>
        <div className="summary-card">
          <h3>คำสั่งซื้อทั้งหมด</h3>
          <p className="summary-value">{dashboardData.summary.totalOrders.toLocaleString()}</p>
        </div>
        <div className="summary-card">
          <h3>รายได้รวม</h3>
          <p className="summary-value">฿{dashboardData.summary.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Demographics Section */}
      <div className="analytics-section">
        <h2>ข้อมูลประชากรศาสตร์</h2>
        
        <div className="demographics-grid">
          {/* Gender Distribution */}
          <div className="analytics-card">
            <h3>การกระจายตามเพศ</h3>
            {dashboardData.demographics.gender.length > 0 ? (
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>เพศ</th>
                    <th>จำนวน</th>
                    <th>เปอร์เซ็นต์</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.demographics.gender.map((item, index) => (
                    <tr key={index}>
                      <td>{item.gender === 'male' ? 'ชาย' : item.gender === 'female' ? 'หญิง' : 'อื่นๆ'}</td>
                      <td>{item.count}</td>
                      <td>{item.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="no-data">ไม่มีข้อมูล</p>
            )}
          </div>

          {/* Age Group Distribution */}
          <div className="analytics-card">
            <h3>การกระจายตามช่วงอายุ</h3>
            {dashboardData.demographics.ageGroups.length > 0 ? (
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>ช่วงอายุ</th>
                    <th>จำนวน</th>
                    <th>เปอร์เซ็นต์</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.demographics.ageGroups.map((item, index) => (
                    <tr key={index}>
                      <td>{item.age_group}</td>
                      <td>{item.count}</td>
                      <td>{item.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="no-data">ไม่มีข้อมูล</p>
            )}
          </div>
        </div>
      </div>

      {/* Location Analytics Section */}
      <div className="analytics-section">
        <h2>การกระจายตามพื้นที่</h2>
        
        <div className="location-controls">
          <div className="form-group">
            <label>ระดับข้อมูล:</label>
            <select 
              value={locationLevel} 
              onChange={(e) => {
                setLocationLevel(e.target.value);
                setSelectedProvince('');
                setSelectedDistrict('');
              }}
              className="form-control"
            >
              <option value="province">จังหวัด</option>
              <option value="district">อำเภอ/เขต</option>
              <option value="subdistrict">ตำบล/แขวง</option>
            </select>
          </div>

          {(locationLevel === 'district' || locationLevel === 'subdistrict') && (
            <div className="form-group">
              <label>เลือกจังหวัด:</label>
              <select 
                value={selectedProvince} 
                onChange={(e) => {
                  setSelectedProvince(e.target.value);
                  setSelectedDistrict('');
                }}
                className="form-control"
              >
                <option value="">-- เลือกจังหวัด --</option>
                {dashboardData.location.provinces.map((prov, index) => (
                  <option key={index} value={prov.province}>{prov.province}</option>
                ))}
              </select>
            </div>
          )}

          {locationLevel === 'subdistrict' && selectedProvince && (
            <div className="form-group">
              <label>เลือกอำเภอ/เขต:</label>
              <select 
                value={selectedDistrict} 
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="form-control"
              >
                <option value="">-- เลือกอำเภอ/เขต --</option>
                {/* This would need to be populated from a separate API call */}
              </select>
            </div>
          )}
        </div>

        <div className="analytics-card">
          <h3>
            {locationLevel === 'province' && 'จังหวัด'}
            {locationLevel === 'district' && 'อำเภอ/เขต'}
            {locationLevel === 'subdistrict' && 'ตำบล/แขวง'}
          </h3>
          {locationData.length > 0 ? (
            <div className="table-responsive">
              <table className="analytics-table">
                <thead>
                  <tr>
                    {locationLevel === 'province' && <th>จังหวัด</th>}
                    {locationLevel === 'district' && (
                      <>
                        <th>จังหวัด</th>
                        <th>อำเภอ/เขต</th>
                      </>
                    )}
                    {locationLevel === 'subdistrict' && (
                      <>
                        <th>จังหวัด</th>
                        <th>อำเภอ/เขต</th>
                        <th>ตำบล/แขวง</th>
                      </>
                    )}
                    <th>จำนวนลูกค้า</th>
                    <th>จำนวนคำสั่งซื้อ</th>
                    <th>รายได้รวม</th>
                  </tr>
                </thead>
                <tbody>
                  {locationData.map((item, index) => (
                    <tr key={index}>
                      {locationLevel === 'province' && <td>{item.province}</td>}
                      {locationLevel === 'district' && (
                        <>
                          <td>{item.province}</td>
                          <td>{item.district}</td>
                        </>
                      )}
                      {locationLevel === 'subdistrict' && (
                        <>
                          <td>{item.province}</td>
                          <td>{item.district}</td>
                          <td>{item.subdistrict}</td>
                        </>
                      )}
                      <td>{item.customer_count}</td>
                      <td>{item.order_count}</td>
                      <td>฿{parseFloat(item.total_revenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="no-data">ไม่มีข้อมูล</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
