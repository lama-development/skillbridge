document.addEventListener('DOMContentLoaded', function() {
    const skillInput = document.getElementById('skillInput');
    const addSkillBtn = document.getElementById('addSkillBtn');
    const skillsList = document.getElementById('skillsList');

    if (addSkillBtn && skillInput) {
        addSkillBtn.addEventListener('click', () => {
            addSkill();
        });

        skillInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addSkill();
            }
        });
    }

    function addSkill() {
        const skill = skillInput.value.trim();
        if (!skill) return;

        // Verifica se la skill esiste già
        const existingSkills = Array.from(skillsList.querySelectorAll('input[name="skills[]"]'))
            .map(input => input.value.toLowerCase());
        
        if (existingSkills.includes(skill.toLowerCase())) {
            alert('Questa competenza è già stata aggiunta!');
            return;
        }

        // Verifica il limite massimo di skills
        if (existingSkills.length >= 10) {
            alert('Hai raggiunto il limite massimo di 10 competenze!');
            return;
        }

        // Crea il badge della skill
        const skillBadge = document.createElement('div');
        skillBadge.className = 'skill-badge';
        skillBadge.innerHTML = `
            <input type="hidden" name="skills[]" value="${skill}">
            <span class="badge bg-primary d-flex align-items-center">
                ${skill}
                <button type="button" class="btn-close btn-close-white ms-2" onclick="removeSkill(this)"></button>
            </span>
        `;

        skillsList.appendChild(skillBadge);
        skillInput.value = '';
    }
});

function removeSkill(button) {
    button.closest('.skill-badge').remove();
}
