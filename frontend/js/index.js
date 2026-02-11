 // State management
 let foods = JSON.parse(localStorage.getItem('my_foods')) || [];
        
 // Initialize Icons
 function initIcons() {
     lucide.createIcons();
 }

 // Helper: Toggle Modal
 function toggleModal(id) {
     const modal = document.getElementById(id);
     modal.classList.toggle('hidden');
     if (!modal.classList.contains('hidden')) {
         document.getElementById('food-form').reset();
         document.getElementById('edit-id').value = '';
         document.getElementById('modal-title').innerText = '食材を追加';
         
         // Set default date to today
         const today = new Date().toISOString().split('T')[0];
         document.getElementById('item-expiry').value = today;
     }
 }

 // Helper: Toast notification
 function showToast(msg) {
     const toast = document.getElementById('toast');
     toast.innerText = msg;
     toast.classList.remove('opacity-0');
     setTimeout(() => toast.classList.add('opacity-0'), 2000);
 }

 // Calculate days remaining
 function getDaysLeft(dateStr) {
     const expiry = new Date(dateStr);
     const today = new Date();
     today.setHours(0,0,0,0);
     const diff = expiry - today;
     return Math.ceil(diff / (1000 * 60 * 60 * 24));
 }

 // Save & Render
 function saveToStorage() {
     localStorage.setItem('my_foods', JSON.stringify(foods));
     renderItems();
 }

 function renderItems() {
     const list = document.getElementById('food-list');
     const searchTerm = document.getElementById('search-input').value.toLowerCase();
     const categoryFilter = document.getElementById('filter-category').value;
     
     list.innerHTML = '';
     
     let total = 0;
     let warning = 0;
     let expired = 0;

     const filteredFoods = foods.filter(item => {
         const matchesSearch = item.name.toLowerCase().includes(searchTerm);
         const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
         return matchesSearch && matchesCategory;
     }).sort((a, b) => new Date(a.expiry) - new Date(b.expiry));

     filteredFoods.forEach(item => {
         const daysLeft = getDaysLeft(item.expiry);
         let statusClass = 'safe';
         let statusText = `あと ${daysLeft} 日`;
         
         if (daysLeft < 0) {
             statusClass = 'expired';
             statusText = '期限切れ';
             expired++;
         } else if (daysLeft <= 3) {
             statusClass = 'expiring-soon';
             statusText = 'まもなく期限';
             warning++;
         }
         total++;

         const card = document.createElement('div');
         card.className = `bg-white p-4 rounded-2xl shadow-sm flex justify-between items-center ${statusClass} transition-all hover:shadow-md`;
         card.innerHTML = `
             <div class="flex-1">
                 <div class="flex items-center gap-2 mb-1">
                     <span class="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">${item.category}</span>
                     <span class="text-xs font-bold ${daysLeft < 0 ? 'text-red-500' : (daysLeft <= 3 ? 'text-amber-500' : 'text-emerald-500')}">${statusText}</span>
                 </div>
                 <h3 class="font-bold text-gray-800">${item.name}</h3>
                 <p class="text-xs text-gray-400">数量: ${item.quantity || '設定なし'} | 期限: ${item.expiry}</p>
             </div>
             <div class="flex gap-1">
                 <button onclick="editItem('${item.id}')" class="p-2 text-gray-400 hover:text-emerald-500 transition-colors">
                     <i data-lucide="edit-3" class="w-5 h-5"></i>
                 </button>
                 <button onclick="deleteItem('${item.id}')" class="p-2 text-gray-400 hover:text-red-500 transition-colors">
                     <i data-lucide="trash-2" class="w-5 h-5"></i>
                 </button>
             </div>
         `;
         list.appendChild(card);
     });

     if (filteredFoods.length === 0) {
         list.innerHTML = `
             <div class="text-center py-10 text-gray-400">
                 <i data-lucide="package-open" class="mx-auto w-12 h-12 mb-2 opacity-20"></i>
                 <p>食材が見つかりません</p>
             </div>
         `;
     }

     // Update stats
     document.getElementById('stat-total').innerText = foods.length;
     document.getElementById('stat-warning').innerText = foods.filter(i => getDaysLeft(i.expiry) >= 0 && getDaysLeft(i.expiry) <= 3).length;
     document.getElementById('stat-expired').innerText = foods.filter(i => getDaysLeft(i.expiry) < 0).length;

     initIcons();
 }

 // Form Submission
 document.getElementById('food-form').addEventListener('submit', (e) => {
     e.preventDefault();
     const editId = document.getElementById('edit-id').value;
     const newItem = {
         id: editId || Date.now().toString(),
         name: document.getElementById('item-name').value,
         category: document.getElementById('item-category').value,
         quantity: document.getElementById('item-quantity').value,
         expiry: document.getElementById('item-expiry').value
     };

     if (editId) {
         foods = foods.map(item => item.id === editId ? newItem : item);
         showToast('更新しました');
     } else {
         foods.push(newItem);
         showToast('追加しました');
     }

     saveToStorage();
     toggleModal('add-modal');
 });

 // Delete
 function deleteItem(id) {
     if (confirm('この食材を削除してもよろしいですか？')) {
         foods = foods.filter(item => item.id !== id);
         saveToStorage();
         showToast('削除しました');
     }
 }

 // Edit
 function editItem(id) {
     const item = foods.find(i => i.id === id);
     if (!item) return;

     document.getElementById('edit-id').value = item.id;
     document.getElementById('item-name').value = item.name;
     document.getElementById('item-category').value = item.category;
     document.getElementById('item-quantity').value = item.quantity;
     document.getElementById('item-expiry').value = item.expiry;
     
     document.getElementById('modal-title').innerText = '食材を編集';
     document.getElementById('add-modal').classList.remove('hidden');
     initIcons();
 }

 // Initial render
 window.onload = () => {
     renderItems();
 };