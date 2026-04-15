import { Component } from '@angular/core';
import { Sidebar } from '../sidebar/sidebar';

@Component({
  selector: 'app-members',
  imports: [Sidebar],
  templateUrl: './members.html',
  styleUrl: './members.css'
})
export class Members {
  members = [
    {
      name: 'Тимур Нуров', initials: 'ТН', role: 'Видеограф',
      gradient: 'linear-gradient(135deg,#a29bfe,#6c5ce7)',
      orders: 7, inProgress: 2
    },
    {
      name: 'Камила Серикова', initials: 'КС', role: 'Монтажёр',
      gradient: 'linear-gradient(135deg,#fd79a8,#e84393)',
      orders: 12, inProgress: 1
    },
    {
      name: 'Арман Жумабаев', initials: 'АЖ', role: 'Фотограф',
      gradient: 'linear-gradient(135deg,#00cec9,#0984e3)',
      orders: 5, inProgress: 3
    },
    {
      name: 'Мадина Алиева', initials: 'МА', role: 'Звукорежиссёр',
      gradient: 'linear-gradient(135deg,#ffeaa7,#f39c12)',
      orders: 9, inProgress: 0
    },
    {
      name: 'Ерлан Тасболатов', initials: 'ЕТ', role: 'Видеограф',
      gradient: 'linear-gradient(135deg,#55efc4,#00b894)',
      orders: 3, inProgress: 1
    },
  ];
}
