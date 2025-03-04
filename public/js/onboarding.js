function selectRole(role) {
    document.querySelectorAll('.option').forEach(el => el.classList.remove('selected'));
    document.querySelector(`[onclick="selectRole('${role}')"]`).classList.add('selected');
    
    document.getElementById('freelancer-fields').style.display = role === 'freelancer' ? 'block' : 'none';
    document.getElementById('azienda-fields').style.display = role === 'azienda' ? 'block' : 'none';
    checkCompletion();
}