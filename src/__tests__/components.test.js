import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import RoleSelector from '../components/ui/RoleSelector';
import StatusPill from '../components/ui/StatusPill';
import { getSubjectColors } from '../components/SubjectBadge';
import colors from '../theme/colors';

describe('RoleSelector', () => {
  test('marks the current role and reports a new choice', () => {
    const onChange = jest.fn();
    const { getByRole, getByText } = render(<RoleSelector value="student" onChange={onChange} />);

    expect(getByRole('radio', { name: /^Student/ }).props.accessibilityState.selected).toBe(true);
    expect(getByText('I want to find a tutor')).toBeTruthy();

    fireEvent.press(getByRole('radio', { name: /^Tutor/ }));
    expect(onChange).toHaveBeenCalledWith('tutor');
  });
});

describe('StatusPill', () => {
  test('shows the status label, with a fallback for unknown values', () => {
    expect(render(<StatusPill status="pending" />).getByText('Pending')).toBeTruthy();
    expect(render(<StatusPill status="weird" />).getByText('Unknown')).toBeTruthy();
  });
});

describe('subject colours', () => {
  test('group subjects by department', () => {
    expect(getSubjectColors('AP Calculus BC')).toEqual(getSubjectColors('Algebra 1'));
    expect(getSubjectColors('Chemistry')).toEqual(getSubjectColors('AP Biology'));
  });

  test('languages are not filed under English', () => {
    expect(getSubjectColors('AP Spanish Language')).toEqual(getSubjectColors('Latin 1'));
    expect(getSubjectColors('AP Spanish Language')).not.toEqual(getSubjectColors('English 2'));
  });

  test('unknown or missing subjects get the neutral colour', () => {
    expect(getSubjectColors(null)).toEqual({ bg: colors.gray100, text: colors.gray600 });
  });
});
