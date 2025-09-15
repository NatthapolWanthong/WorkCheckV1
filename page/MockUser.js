// /page/MockUser.js

// null = default
const user = {
  id: 2,
  name: "Mock Uesr",

  department_id: 3, // 1 = Sales    |    2 = IT    |    3 = HR    

  // เป็น permission พิเศษของ user ถ้าเป็น null จะไปใช้ default permission จาก database (ตาราง departments) 
  department_view: null, // "1,2" = เห็นแค่แผนก 1 กับ 2   |    0 = เห็นทุกแผนก
  can_edit: null, // 1 = สามารถเห็น    |    0 = สามารถไม่เห็น
  can_view_history: null // 1 = สามารถเห็น    |    0 = สามารถไม่เห็น
};
  
export default user;  