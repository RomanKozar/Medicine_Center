# Test Cases - Medicine Center API

## Test Case 1 - GET /api/patient/me
**Назва:** Отримання профілю пацієнта  

**Передумови:**  
- Користувач авторизований  
- Є валідний JWT токен  

**Запит **GET http://localhost:8000/api/patient/me****

**Очікуваний результат:**  
- Статус код: **200 OK**  
- `success: true`  
- `message: "Profile fetched"`  
- Повертається JSON з коректними даними користувача

**Фактичний результат:**  
- Статус код: **200 OK**  
- Дані успішно повертаються (відповідно до скріншоту)  
- `message: "Profile fetched"`  

<img width="987" height="808" alt="image" src="https://github.com/user-attachments/assets/2f683a1e-6e1e-49c5-ba34-3487492be6bd" />


---

## Test Case 2 - PUT /api/patient/onboarding/update  
**Назва:** Оновлення профілю пацієнта  

**Передумови:**  
- Користувач авторизований  
- Профіль існує  
- Тіло запиту містить валідні дані  


**Запит **PUT http://localhost:8000/api/patient/onboarding/update****

 У Body → JSON вставити:  
```json
{
  "bloodGroup": "AB+",
  "medicalHistory": {
    "allergies": "no",
    "currentMedications": "no",
    "chronicConditions": "updated"
  },
  "emergencyContact": {
    "name": "Roman Kozar",
    "phone": "+380954648138",
    "relationship": "relative"
  }
}
```
**Очікуваний результат:**  
- Статус код: **200 OK**  
- `success: true`  
- `message: "Profile updated"`  
- Дані у відповіді повинні відповідати оновленим
- Значення updatedAt повинно змінитися

**Фактичний результат:**  
- Статус код: **200 OK**  
- Дані успішно повертаються (відповідно до скріншоту)  
- `message: "Profile updated"`  

<img width="1053" height="811" alt="image" src="https://github.com/user-attachments/assets/bf996660-d93a-457d-a10f-6b47503f8858" />

---


## Test Case 3 - GET /api/patient/me без токена
**Назва:** Отримання профілю без авторизації

**Передумови:**  
- Відсутній або неправильний JWT токен  

**Запит **GET http://localhost:8000/api/patient/me****

**Очікуваний результат:**  
- Статус код: **400 Bad Request**  
- `success: false`  
- `message: "Unauthorized" або "Invalid token"`  
- Повертається JSON з коректними даними користувача

**Фактичний результат:**  
- Статус код: **400 Bad Request**  
- Відсутній JWT токен 
- `message: "Invalid or expired token"`  

<img width="967" height="494" alt="image" src="https://github.com/user-attachments/assets/16cd50d6-f08a-4124-b9ca-73a60b7fae95" />



