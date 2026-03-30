# FoodBridge 🌿 | Technical Implementation & Strategic Documentation

## 1. Project Concept & Vision

### 1.1 The Problem: The "Supply-Waste" Paradox
In the hospitality and event management sectors, massive quantities of high-quality, edible food are discarded daily due to strict inventory policies and lack of immediate redistribution channels. Conversely, local community NGOs often lack the real-time visibility and logistics capability to rescue this food before it expires.

### 1.2 The Solution: A Real-Time Logistics Bridge
**FoodBridge** is a decentralized logistics platform that creates a transparent, role-based marketplace for food redistribution. By integrating real-time tracking, secure handoffs, and urgency-based discovery, the platform ensures that surplus food reaches beneficiaries with maximum safety and efficiency.

---

## 2. Technical Architecture

### 2.1 The MERN Ecosystem
The application follows a standard **MERN** (MongoDB, Express, React, Node) architecture, optimized for real-time data flow and high-accuracy geospatial queries.

- **Storage (MongoDB)**: Utilizes `2dsphere` geospatial indexing for proximity-based discovery of donations and requests.
- **Server (Node/Express)**: Implements a RESTful API with a heavy focus on **Security Middleware**:
    - `Helmet`: Secure HTTP headers.
    - `RateLimit`: Prevents brute-force/DDoS on authentication and API routes.
    - `Data Sanitization`: Custom middleware to prevent NoSQL injection and XSS.
- **Client (React/Vite)**: A high-performance SPA using **Context API** for global state management (Auth, Theme, Notifications).

### 2.2 Security & Authentication
- **JWT (JSON Web Tokens)**: Stateless authentication with tokens stored in local storage and sent via `Authorization` headers.
- **RBAC (Role-Based Access Control)**: Granular permission layers ensuring that only authorized roles (Donor, NGO, Volunteer, Receiver, Admin) can perform specific actions (e.g., only NGOs can "Claim," only Donors can "Verify Pickup").

---

## 3. The Logistics Lifecycle (Implementation Details)

### 3.1 Trust Infrastructure (OTP Verification)
To prevent unauthorized collection or delivery failures, the system implements a **Secure Handoff Protocol**:
- **Pickup Phase**: When a Volunteer arrives at the Donor's location, the Donor provides a unique 4-digit `pickupCode` generated at the time of the claim.
- **Delivery Phase**: Upon arrival at the Receiver's location, the Receiver providing a 4-digit `deliveryCode` to the Volunteer.
- **Status Integrity**: Transitioning to `in_transit` or `completed` is impossible without these cryptographically generated codes.

### 3.2 Zomato-Style Live Tracking
The platform implements a **High-Frequency Tracking Engine** for active missions:
- **Volunteer Heartbeat**: While in `in_transit` status, the Volunteer's client sends a GPS heartbeat every 15 seconds to the backend.
- **Observer Logic**: NGOs and Admins view the Volunteer's real-time position on a **Mapbox GL JS** powered tracker, providing a professional logistics experience.

---

## 4. Database Design & Geospatial Logic

### 4.1 Key Models
- **User**: Five distinct personas with role-specific metrics (Karma, Total Donations).
- **Donation**: The atomic unit of the system. Tracks food type, quantity, images, and **Urgency** (calculated from `expiresAt`).
- **Transaction**: Manages the link between Donor, NGO, Volunteer, and Receiver. Stores the secure codes and tracking history.
- **Inventory**: Automatic warehouse logging for NGOs claiming food for bulk storage.

### 4.2 Proximity Discovery
The system uses MongoDB's `$near` operator:
```javascript
filter.location = {
  $near: {
    $geometry: { type: 'Point', coordinates: [lng, lat] },
    $maxDistance: radiusInMeters
  }
};
```
This ensures that donors see nearby NGOs and volunteers see missions within their operational radius.

---

## 5. Sustainability Analytics (CSR Logic)

### 5.1 CO2 Offset Calculation
Impact is calculated based on the weight saved from landfills, preventing methane production:
- **Formula**: `Weight (kg) * Environmental Factor = CO2 Offset`.
- *Note: This provides concrete data for corporate donors' CSR reports.*

### 5.2 The Karma System
To incentivize logistics consistency, volunteers are rewarded:
- **Delivery Success**: +10 Karma points upon mission completion.
- **High-Urgency Mission**: Bonus points for rescuing food with <2 hours of remaining life.

---

## 6. Future Enhancements

1. **AI Route Optimization**: Using historical traffic data to suggest better delivery paths.
2. **Predictive Analytics**: Forecasting food surplus trends for specific city regions.
3. **Deep IoT Integration**: Temperature-monitored smart containers for high-compliance food transport.

---

*Academic Submission 2026 — Built for Social Impact & Environmental Sustainability.*
